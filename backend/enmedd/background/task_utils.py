from collections.abc import Callable
from functools import wraps
from typing import Any
from typing import cast
from typing import Optional
from typing import TypeVar

from celery import Task
from celery.result import AsyncResult
from fastapi import Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from enmedd.db.engine import get_sqlalchemy_engine
from enmedd.db.tasks import mark_task_finished
from enmedd.db.tasks import mark_task_start
from enmedd.db.tasks import register_task
from enmedd.server.middleware.tenant_identification import get_tenant_id


def name_cc_prune_task(
    connector_id: int | None = None, credential_id: int | None = None
) -> str:
    task_name = f"prune_connector_credential_pair_{connector_id}_{credential_id}"
    if not connector_id or not credential_id:
        task_name = "prune_connector_credential_pair"
    return task_name


T = TypeVar("T", bound=Callable)


def build_run_wrapper(
    build_name_fn: Callable[..., str], tenant_id: Optional[str] = Depends(get_tenant_id)
) -> Callable[[T], T]:
    """Utility meant to wrap the celery task `run` function in order to
    automatically update our custom `task_queue_jobs` table appropriately"""

    def wrap_task_fn(task_fn: T) -> T:
        @wraps(task_fn)
        def wrapped_task_fn(*args: list, **kwargs: dict) -> Any:
            engine = get_sqlalchemy_engine()

            task_name = build_name_fn(*args, **kwargs)
            with Session(engine) as db_session:
                if tenant_id:
                    db_session.execute(
                        text("SET search_path TO :schema_name").params(
                            schema_name=tenant_id
                        )
                    )
                # mark the task as started
                mark_task_start(task_name=task_name, db_session=db_session)

            result = None
            exception = None
            try:
                result = task_fn(*args, **kwargs)
            except Exception as e:
                exception = e

            with Session(engine) as db_session:
                if tenant_id:
                    db_session.execute(
                        text("SET search_path TO :schema_name").params(
                            schema_name=tenant_id
                        )
                    )
                mark_task_finished(
                    task_name=task_name,
                    db_session=db_session,
                    success=exception is None,
                )

            if not exception:
                return result
            else:
                raise exception

        return cast(T, wrapped_task_fn)

    return wrap_task_fn


# rough type signature for `apply_async`
AA = TypeVar("AA", bound=Callable[..., AsyncResult])


def build_apply_async_wrapper(
    build_name_fn: Callable[..., str], tenant_id: Optional[str] = Depends(get_tenant_id)
) -> Callable[[AA], AA]:
    """Utility meant to wrap celery `apply_async` function in order to automatically
    update create an entry in our `task_queue_jobs` table"""

    def wrapper(fn: AA) -> AA:
        @wraps(fn)
        def wrapped_fn(
            args: tuple | None = None,
            kwargs: dict[str, Any] | None = None,
            *other_args: list,
            **other_kwargs: dict[str, Any],
        ) -> Any:
            # `apply_async` takes in args / kwargs directly as arguments
            args_for_build_name = args or tuple()
            kwargs_for_build_name = kwargs or {}
            task_name = build_name_fn(*args_for_build_name, **kwargs_for_build_name)
            with Session(get_sqlalchemy_engine()) as db_session:
                if tenant_id:
                    db_session.execute(
                        text("SET search_path TO :schema_name").params(
                            schema_name=tenant_id
                        )
                    )
                # register_task must come before fn = apply_async or else the task
                # might run mark_task_start (and crash) before the task row exists
                db_task = register_task(task_name, db_session)

                task = fn(args, kwargs, *other_args, **other_kwargs)

                # we update the celery task id for diagnostic purposes
                # but it isn't currently used by any code
                db_task.task_id = task.id
                db_session.commit()

            return task

        return cast(AA, wrapped_fn)

    return wrapper


def build_celery_task_wrapper(
    build_name_fn: Callable[..., str]
) -> Callable[[Task], Task]:
    """Utility meant to wrap celery task functions in order to automatically
    update our custom `task_queue_jobs` table appropriately.

    On task creation (e.g. `apply_async`), a row is inserted into the table with
    status `PENDING`.
    On task start, the latest row is updated to have status `STARTED`.
    On task success, the latest row is updated to have status `SUCCESS`.
    On the task raising an unhandled exception, the latest row is updated to have
    status `FAILURE`.
    """

    def wrap_task(task: Task) -> Task:
        task.run = build_run_wrapper(build_name_fn)(task.run)  # type: ignore
        task.apply_async = build_apply_async_wrapper(build_name_fn)(task.apply_async)  # type: ignore
        return task

    return wrap_task
