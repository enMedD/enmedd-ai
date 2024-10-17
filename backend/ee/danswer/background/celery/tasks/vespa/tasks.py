from typing import cast

from redis import Redis
from sqlalchemy.orm import Session

from enmedd.background.celery.celery_app import task_logger
from enmedd.background.celery.celery_redis import RedisTeamspace
from enmedd.utils.logger import setup_logger
from ee.enmedd.db.teamspace import delete_teamspace
from ee.enmedd.db.teamspace import fetch_teamspace
from ee.enmedd.db.teamspace import mark_teamspace_as_synced

logger = setup_logger()


def monitor_teamspace_taskset(key_bytes: bytes, r: Redis, db_session: Session) -> None:
    """This function is likely to move in the worker refactor happening next."""
    fence_key = key_bytes.decode("utf-8")
    teamspace_id = RedisTeamspace.get_id_from_fence_key(fence_key)
    if not teamspace_id:
        task_logger.warning(f"Could not parse teamspace id from {fence_key}")
        return

    rug = RedisTeamspace(teamspace_id)
    fence_value = r.get(rug.fence_key)
    if fence_value is None:
        return

    try:
        initial_count = int(cast(int, fence_value))
    except ValueError:
        task_logger.error("The value is not an integer.")
        return

    count = cast(int, r.scard(rug.taskset_key))
    task_logger.info(
        f"User group sync progress: teamspace_id={teamspace_id} remaining={count} initial={initial_count}"
    )
    if count > 0:
        return

    teamspace = fetch_teamspace(db_session=db_session, teamspace_id=teamspace_id)
    if teamspace:
        if teamspace.is_up_for_deletion:
            delete_teamspace(db_session=db_session, teamspace=teamspace)
            task_logger.info(f"Deleted teamspace. id='{teamspace_id}'")
        else:
            mark_teamspace_as_synced(db_session=db_session, teamspace=teamspace)
            task_logger.info(f"Synced teamspace. id='{teamspace_id}'")

    r.delete(rug.taskset_key)
    r.delete(rug.fence_key)
