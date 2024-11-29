from typing import Optional

from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from ee.enmedd.db.api_key import ApiKeyDescriptor
from ee.enmedd.db.api_key import fetch_api_keys
from ee.enmedd.db.api_key import insert_api_key
from ee.enmedd.db.api_key import regenerate_api_key
from ee.enmedd.db.api_key import remove_api_key
from ee.enmedd.db.api_key import update_api_key
from ee.enmedd.server.api_key.models import APIKeyArgs
from enmedd.auth.users import current_workspace_admin_user
from enmedd.db.engine import get_session
from enmedd.db.models import User
from enmedd.server.middleware.tenant_identification import get_tenant_id


router = APIRouter(prefix="/admin/api-key")


@router.get("")
def list_api_keys(
    _: User | None = Depends(current_workspace_admin_user),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> list[ApiKeyDescriptor]:
    if tenant_id:
        db_session.execute(
            text("SET search_path TO :schema_name").params(schema_name=tenant_id)
        )
    return fetch_api_keys(db_session)


@router.post("")
def create_api_key(
    api_key_args: APIKeyArgs,
    user: User | None = Depends(current_workspace_admin_user),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> ApiKeyDescriptor:
    if tenant_id:
        db_session.execute(
            text("SET search_path TO :schema_name").params(schema_name=tenant_id)
        )
    return insert_api_key(db_session, api_key_args, user.id if user else None)


@router.post("/{api_key_id}/regenerate")
def regenerate_existing_api_key(
    api_key_id: int,
    _: User | None = Depends(current_workspace_admin_user),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> ApiKeyDescriptor:
    if tenant_id:
        db_session.execute(
            text("SET search_path TO :schema_name").params(schema_name=tenant_id)
        )
    return regenerate_api_key(db_session, api_key_id)


@router.patch("/{api_key_id}")
def update_existing_api_key(
    api_key_id: int,
    api_key_args: APIKeyArgs,
    _: User | None = Depends(current_workspace_admin_user),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> ApiKeyDescriptor:
    if tenant_id:
        db_session.execute(
            text("SET search_path TO :schema_name").params(schema_name=tenant_id)
        )
    return update_api_key(db_session, api_key_id, api_key_args)


@router.delete("/{api_key_id}")
def delete_api_key(
    api_key_id: int,
    _: User | None = Depends(current_workspace_admin_user),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> None:
    if tenant_id:
        db_session.execute(
            text("SET search_path TO :schema_name").params(schema_name=tenant_id)
        )
    remove_api_key(db_session, api_key_id)
