import logging
import time
from datetime import datetime

import dask
from dask.distributed import Client
from dask.distributed import Future
from distributed import LocalCluster
from sqlalchemy.orm import Session

from enmedd.background.indexing.dask_utils import ResourceLogger
from enmedd.background.indexing.job_client import SimpleJob
from enmedd.background.indexing.job_client import SimpleJobClient
from enmedd.background.indexing.run_indexing import run_indexing_entrypoint
from enmedd.configs.app_configs import CLEANUP_INDEXING_JOBS_TIMEOUT
from enmedd.configs.app_configs import DASK_JOB_CLIENT_ENABLED
from enmedd.configs.app_configs import DISABLE_INDEX_UPDATE_ON_SWAP
from enmedd.configs.app_configs import NUM_INDEXING_WORKERS
from enmedd.configs.app_configs import NUM_SECONDARY_INDEXING_WORKERS
from enmedd.configs.constants import DocumentSource
from enmedd.configs.constants import POSTGRES_INDEXER_APP_NAME
from enmedd.db.connector import fetch_connectors
from enmedd.db.connector_credential_pair import fetch_connector_credential_pairs
from enmedd.db.engine import get_db_current_time
from enmedd.db.engine import get_sqlalchemy_engine
from enmedd.db.engine import init_sqlalchemy_engine
from enmedd.db.index_attempt import create_index_attempt
from enmedd.db.index_attempt import get_index_attempt
from enmedd.db.index_attempt import get_inprogress_index_attempts
from enmedd.db.index_attempt import get_last_attempt_for_cc_pair
from enmedd.db.index_attempt import get_not_started_index_attempts
from enmedd.db.index_attempt import mark_attempt_failed
from enmedd.db.models import ConnectorCredentialPair
from enmedd.db.models import IndexAttempt
from enmedd.db.models import IndexingStatus
from enmedd.db.models import IndexModelStatus
from enmedd.db.models import SearchSettings
from enmedd.db.search_settings import get_current_search_settings
from enmedd.db.search_settings import get_secondary_search_settings
from enmedd.db.swap_index import check_index_swap
from enmedd.natural_language_processing.search_nlp_models import EmbeddingModel
from enmedd.natural_language_processing.search_nlp_models import warm_up_bi_encoder
from enmedd.utils.logger import setup_logger
from enmedd.utils.variable_functionality import global_version
from enmedd.utils.variable_functionality import set_is_ee_based_on_env_variable
from shared_configs.configs import INDEXING_MODEL_SERVER_HOST
from shared_configs.configs import LOG_LEVEL
from shared_configs.configs import MODEL_SERVER_PORT

logger = setup_logger()

# If the indexing dies, it's most likely due to resource constraints,
# restarting just delays the eventual failure, not useful to the user
dask.config.set({"distributed.scheduler.allowed-failures": 0})

_UNEXPECTED_STATE_FAILURE_REASON = (
    "Stopped mid run, likely due to the background process being killed"
)


def _should_create_new_indexing(
    cc_pair: ConnectorCredentialPair,
    last_index: IndexAttempt | None,
    search_settings_instance: SearchSettings,
    secondary_index_building: bool,
    db_session: Session,
) -> bool:
    connector = cc_pair.connector

    # don't kick off indexing for `NOT_APPLICABLE` sources
    if connector.source == DocumentSource.NOT_APPLICABLE:
        return False

    # User can still manually create single indexing attempts via the UI for the
    # currently in use index
    if DISABLE_INDEX_UPDATE_ON_SWAP:
        if (
            search_settings_instance.status == IndexModelStatus.PRESENT
            and secondary_index_building
        ):
            return False

    # When switching over models, always index at least once
    if search_settings_instance.status == IndexModelStatus.FUTURE:
        if last_index:
            # No new index if the last index attempt succeeded
            # Once is enough. The model will never be able to swap otherwise.
            if last_index.status == IndexingStatus.SUCCESS:
                return False

            # No new index if the last index attempt is waiting to start
            if last_index.status == IndexingStatus.NOT_STARTED:
                return False

            # No new index if the last index attempt is running
            if last_index.status == IndexingStatus.IN_PROGRESS:
                return False
        else:
            if (
                connector.id == 0 or connector.source == DocumentSource.INGESTION_API
            ):  # Ingestion API
                return False
        return True

    # If the connector is paused or is the ingestion API, don't index
    # NOTE: during an embedding model switch over, the following logic
    # is bypassed by the above check for a future model
    if (
        not cc_pair.status.is_active()
        or connector.id == 0
        or connector.source == DocumentSource.INGESTION_API
    ):
        return False

    if not last_index:
        return True

    if connector.refresh_freq is None:
        return False

    # Only one scheduled/ongoing job per connector at a time
    # this prevents cases where
    # (1) the "latest" index_attempt is scheduled so we show
    #     that in the UI despite another index_attempt being in-progress
    # (2) multiple scheduled index_attempts at a time
    if (
        last_index.status == IndexingStatus.NOT_STARTED
        or last_index.status == IndexingStatus.IN_PROGRESS
    ):
        return False

    current_db_time = get_db_current_time(db_session)
    time_since_index = current_db_time - last_index.time_updated
    return time_since_index.total_seconds() >= connector.refresh_freq


def _mark_run_failed(
    db_session: Session, index_attempt: IndexAttempt, failure_reason: str
) -> None:
    """Marks the `index_attempt` row as failed + updates the `
    connector_credential_pair` to reflect that the run failed"""
    logger.warning(
        f"Marking in-progress attempt 'connector: {index_attempt.connector_credential_pair.connector_id}, "
        f"credential: {index_attempt.connector_credential_pair.credential_id}' as failed due to {failure_reason}"
    )
    mark_attempt_failed(
        index_attempt=index_attempt,
        db_session=db_session,
        failure_reason=failure_reason,
    )


"""Main funcs"""


def create_indexing_jobs(existing_jobs: dict[int, Future | SimpleJob]) -> None:
    """Creates new indexing jobs for each connector / credential pair which is:
    1. Enabled
    2. `refresh_frequency` time has passed since the last indexing run for this pair
    3. There is not already an ongoing indexing attempt for this pair
    """
    with Session(get_sqlalchemy_engine()) as db_session:
        ongoing: set[tuple[int | None, int]] = set()
        for attempt_id in existing_jobs:
            attempt = get_index_attempt(
                db_session=db_session, index_attempt_id=attempt_id
            )
            if attempt is None:
                logger.error(
                    f"Unable to find IndexAttempt for ID '{attempt_id}' when creating "
                    "indexing jobs"
                )
                continue
            ongoing.add(
                (
                    attempt.connector_credential_pair_id,
                    attempt.search_settings_id,
                )
            )

        # Get the primary search settings
        primary_search_settings = get_current_search_settings(db_session)
        search_settings = [primary_search_settings]

        # Check for secondary search settings
        secondary_search_settings = get_secondary_search_settings(db_session)
        if secondary_search_settings is not None:
            # If secondary settings exist, add them to the list
            search_settings.append(secondary_search_settings)

        all_connector_credential_pairs = fetch_connector_credential_pairs(db_session)
        for cc_pair in all_connector_credential_pairs:
            for search_settings_instance in search_settings:
                # Check if there is an ongoing indexing attempt for this connector credential pair
                if (cc_pair.id, search_settings_instance.id) in ongoing:
                    continue

                last_attempt = get_last_attempt_for_cc_pair(
                    cc_pair.id, search_settings_instance.id, db_session
                )
                if not _should_create_new_indexing(
                    cc_pair=cc_pair,
                    last_index=last_attempt,
                    search_settings_instance=search_settings_instance,
                    secondary_index_building=len(search_settings) > 1,
                    db_session=db_session,
                ):
                    continue

                create_index_attempt(
                    cc_pair.id, search_settings_instance.id, db_session
                )


def cleanup_indexing_jobs(
    existing_jobs: dict[int, Future | SimpleJob],
    timeout_hours: int = CLEANUP_INDEXING_JOBS_TIMEOUT,
) -> dict[int, Future | SimpleJob]:
    existing_jobs_copy = existing_jobs.copy()
    # clean up completed jobs
    with Session(get_sqlalchemy_engine()) as db_session:
        for attempt_id, job in existing_jobs.items():
            index_attempt = get_index_attempt(
                db_session=db_session, index_attempt_id=attempt_id
            )

            # do nothing for ongoing jobs that haven't been stopped
            if not job.done():
                if not index_attempt:
                    continue

                if not index_attempt.is_finished():
                    continue

            if job.status == "error":
                logger.error(job.exception())

            job.release()
            del existing_jobs_copy[attempt_id]

            if not index_attempt:
                logger.error(
                    f"Unable to find IndexAttempt for ID '{attempt_id}' when cleaning "
                    "up indexing jobs"
                )
                continue

            if (
                index_attempt.status == IndexingStatus.IN_PROGRESS
                or job.status == "error"
            ):
                _mark_run_failed(
                    db_session=db_session,
                    index_attempt=index_attempt,
                    failure_reason=_UNEXPECTED_STATE_FAILURE_REASON,
                )

        # clean up in-progress jobs that were never completed
        connectors = fetch_connectors(db_session)
        for connector in connectors:
            in_progress_indexing_attempts = get_inprogress_index_attempts(
                connector.id, db_session
            )
            for index_attempt in in_progress_indexing_attempts:
                if index_attempt.id in existing_jobs:
                    # If index attempt is canceled, stop the run
                    if index_attempt.status == IndexingStatus.FAILED:
                        existing_jobs[index_attempt.id].cancel()
                    # check to see if the job has been updated in last `timeout_hours` hours, if not
                    # assume it to frozen in some bad state and just mark it as failed. Note: this relies
                    # on the fact that the `time_updated` field is constantly updated every
                    # batch of documents indexed
                    current_db_time = get_db_current_time(db_session=db_session)
                    time_since_update = current_db_time - index_attempt.time_updated
                    if time_since_update.total_seconds() > 60 * 60 * timeout_hours:
                        existing_jobs[index_attempt.id].cancel()
                        _mark_run_failed(
                            db_session=db_session,
                            index_attempt=index_attempt,
                            failure_reason="Indexing run frozen - no updates in the last three hours. "
                            "The run will be re-attempted at next scheduled indexing time.",
                        )
                else:
                    # If job isn't known, simply mark it as failed
                    _mark_run_failed(
                        db_session=db_session,
                        index_attempt=index_attempt,
                        failure_reason=_UNEXPECTED_STATE_FAILURE_REASON,
                    )

    return existing_jobs_copy


def kickoff_indexing_jobs(
    existing_jobs: dict[int, Future | SimpleJob],
    client: Client | SimpleJobClient,
    secondary_client: Client | SimpleJobClient,
) -> dict[int, Future | SimpleJob]:
    existing_jobs_copy = existing_jobs.copy()
    engine = get_sqlalchemy_engine()

    # Don't include jobs waiting in the Dask queue that just haven't started running
    # Also (rarely) don't include for jobs that started but haven't updated the indexing tables yet
    with Session(engine) as db_session:
        # get_not_started_index_attempts orders its returned results from oldest to newest
        # we must process attempts in a FIFO manner to prevent connector starvation
        new_indexing_attempts = [
            (attempt, attempt.search_settings)
            for attempt in get_not_started_index_attempts(db_session)
            if attempt.id not in existing_jobs
        ]

    logger.debug(f"Found {len(new_indexing_attempts)} new indexing task(s).")

    if not new_indexing_attempts:
        return existing_jobs

    indexing_attempt_count = 0

    primary_client_full = False
    secondary_client_full = False
    for attempt, search_settings in new_indexing_attempts:
        if primary_client_full and secondary_client_full:
            break

        use_secondary_index = (
            search_settings.status == IndexModelStatus.FUTURE
            if search_settings is not None
            else False
        )
        if attempt.connector_credential_pair.connector is None:
            logger.warning(
                f"Skipping index attempt as Connector has been deleted: {attempt}"
            )
            with Session(engine) as db_session:
                mark_attempt_failed(
                    attempt, db_session, failure_reason="Connector is null"
                )
            continue
        if attempt.connector_credential_pair.credential is None:
            logger.warning(
                f"Skipping index attempt as Credential has been deleted: {attempt}"
            )
            with Session(engine) as db_session:
                mark_attempt_failed(
                    attempt, db_session, failure_reason="Credential is null"
                )
            continue

        if not use_secondary_index:
            if not primary_client_full:
                run = client.submit(
                    run_indexing_entrypoint,
                    attempt.id,
                    attempt.connector_credential_pair_id,
                    global_version.is_ee_version(),
                    pure=False,
                )
                if not run:
                    primary_client_full = True
        else:
            if not secondary_client_full:
                run = secondary_client.submit(
                    run_indexing_entrypoint,
                    attempt.id,
                    attempt.connector_credential_pair_id,
                    global_version.is_ee_version(),
                    pure=False,
                )
                if not run:
                    secondary_client_full = True

        if run:
            if indexing_attempt_count == 0:
                logger.info(
                    f"Indexing dispatch starts: pending={len(new_indexing_attempts)}"
                )

            indexing_attempt_count += 1
            secondary_str = " (secondary index)" if use_secondary_index else ""
            logger.info(
                f"Indexing dispatched{secondary_str}: "
                f"attempt_id={attempt.id} "
                f"connector='{attempt.connector_credential_pair.connector.name}' "
                f"config='{attempt.connector_credential_pair.connector.connector_specific_config}' "
                f"credentials='{attempt.connector_credential_pair.credential_id}'"
            )
            existing_jobs_copy[attempt.id] = run

    if indexing_attempt_count > 0:
        logger.info(
            f"Indexing dispatch results: "
            f"initial_pending={len(new_indexing_attempts)} "
            f"started={indexing_attempt_count} "
            f"remaining={len(new_indexing_attempts) - indexing_attempt_count}"
        )

    return existing_jobs_copy


def update_loop(
    delay: int = 10,
    num_workers: int = NUM_INDEXING_WORKERS,
    num_secondary_workers: int = NUM_SECONDARY_INDEXING_WORKERS,
) -> None:
    engine = get_sqlalchemy_engine()
    with Session(engine) as db_session:
        # update default num_indexing_workers value coming from the db
        # settings = load_settings(db_session)
        # num_workers = settings.num_indexing_workers
        # num_secondary_workers = num_workers

        check_index_swap(db_session=db_session)
        search_settings = get_current_search_settings(db_session)

        # So that the first time users aren't surprised by really slow speed of first
        # batch of documents indexed

        if search_settings.provider_type is None:
            logger.notice("Running a first inference to warm up embedding model")
            embedding_model = EmbeddingModel.from_db_model(
                search_settings=search_settings,
                server_host=INDEXING_MODEL_SERVER_HOST,
                server_port=MODEL_SERVER_PORT,
            )

            warm_up_bi_encoder(
                embedding_model=embedding_model,
            )
            logger.notice("First inference complete.")

    client_primary: Client | SimpleJobClient
    client_secondary: Client | SimpleJobClient
    if DASK_JOB_CLIENT_ENABLED:
        cluster_primary = LocalCluster(
            n_workers=num_workers,
            threads_per_worker=1,
            # there are warning about high memory usage + "Event loop unresponsive"
            # which are not relevant to us since our workers are expected to use a
            # lot of memory + involve CPU intensive tasks that will not relinquish
            # the event loop
            silence_logs=logging.ERROR,
        )
        cluster_secondary = LocalCluster(
            n_workers=num_secondary_workers,
            threads_per_worker=1,
            silence_logs=logging.ERROR,
        )
        client_primary = Client(cluster_primary)
        client_secondary = Client(cluster_secondary)
        if LOG_LEVEL.lower() == "debug":
            client_primary.register_worker_plugin(ResourceLogger())
    else:
        client_primary = SimpleJobClient(n_workers=num_workers)
        client_secondary = SimpleJobClient(n_workers=num_secondary_workers)

    existing_jobs: dict[int, Future | SimpleJob] = {}

    logger.notice("Startup complete. Waiting for indexing jobs...")
    while True:
        start = time.time()
        start_time_utc = datetime.utcfromtimestamp(start).strftime("%Y-%m-%d %H:%M:%S")
        logger.debug(f"Running update, current UTC time: {start_time_utc}")

        if existing_jobs:
            # TODO: make this debug level once the "no jobs are being scheduled" issue is resolved
            logger.debug(
                "Found existing indexing jobs: "
                f"{[(attempt_id, job.status) for attempt_id, job in existing_jobs.items()]}"
            )

        try:
            with Session(get_sqlalchemy_engine()) as db_session:
                check_index_swap(db_session)
            existing_jobs = cleanup_indexing_jobs(existing_jobs=existing_jobs)
            create_indexing_jobs(existing_jobs=existing_jobs)
            existing_jobs = kickoff_indexing_jobs(
                existing_jobs=existing_jobs,
                client=client_primary,
                secondary_client=client_secondary,
            )
        except Exception as e:
            logger.exception(f"Failed to run update due to {e}")
        sleep_time = delay - (time.time() - start)
        if sleep_time > 0:
            time.sleep(sleep_time)


def update__main() -> None:
    set_is_ee_based_on_env_variable()
    init_sqlalchemy_engine(POSTGRES_INDEXER_APP_NAME)

    logger.notice("Starting indexing service")
    update_loop()


if __name__ == "__main__":
    update__main()
