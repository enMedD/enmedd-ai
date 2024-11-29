import logging
from collections.abc import Awaitable
from collections.abc import Callable
from typing import Optional

from fastapi import FastAPI
from fastapi import Request
from fastapi import Response
from sqlalchemy import text
from sqlalchemy.orm import Session


def add_tenant_identification_middleware(
    app: FastAPI, logger: logging.LoggerAdapter
) -> None:
    @app.middleware("http")
    async def identify_tenant(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        tenant_id = request.headers.get("X-Tenant-ID")
        logger.debug(f"Tenant ID: {tenant_id}")
        response = await call_next(request)
        return response


def get_tenant_id(request: Request) -> Optional[str]:
    tenant_id = request.headers.get("X-Tenant-ID")
    if tenant_id:
        return tenant_id.lower().replace("-", "_")
    return None


def db_session_filter(tenant_id: str, db_session: Session) -> None:
    if tenant_id:
        db_session.execute(
            text("SET search_path TO :schema_name").params(schema_name=tenant_id)
        )
