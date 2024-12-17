import contextvars
import logging
from collections.abc import Awaitable
from collections.abc import Callable
from typing import Optional

from fastapi import FastAPI
from fastapi import Request
from fastapi import Response
from sqlalchemy import text
from sqlalchemy.orm import Session


tenant_id_context: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "tenant_id", default=None
)


def set_tenant(tenant_id: str) -> None:
    """Sets the tenant_id in the context."""
    tenant_id_context.set(tenant_id.lower().replace("-", "_"))


def get_tenant() -> Optional[str]:
    """Fetches the tenant_id from the context."""
    return tenant_id_context.get() or "new_workspace"


def add_tenant_identification_middleware(
    app: FastAPI, logger: logging.LoggerAdapter
) -> None:
    @app.middleware("http")
    async def identify_tenant(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        tenant_id = request.headers.get("X-Tenant-ID")
        if tenant_id:
            set_tenant(tenant_id)
        logger.debug(f"Tenant ID: {tenant_id}")
        response = await call_next(request)
        return response


def get_tenant_id(request: Request) -> Optional[str]:
    tenant_id = request.headers.get("X-Tenant-ID")
    if tenant_id:
        return tenant_id.lower().replace("-", "_")
    return "new_workspace"


def db_session_filter(tenant_id: str, db_session: Session) -> None:
    db_session.execute(
        text("SET search_path TO :schema_name").params(schema_name=tenant_id)
    )
