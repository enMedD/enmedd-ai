from typing import Optional

from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from enmedd.auth.users import current_workspace_admin_user
from enmedd.db.engine import get_session
from enmedd.db.index_attempt import (
    get_index_attempt_errors,
)
from enmedd.db.models import User
from enmedd.server.documents.models import IndexAttemptError
from enmedd.server.middleware.tenant_identification import get_tenant_id

router = APIRouter(prefix="/manage")


@router.get("/admin/indexing-errors/{index_attempt_id}")
def get_indexing_errors(
    index_attempt_id: int,
    _: User | None = Depends(current_workspace_admin_user),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> list[IndexAttemptError]:
    if tenant_id:
        db_session.execute(
            text("SET search_path TO :schema_name").params(schema_name=tenant_id)
        )
    indexing_errors = get_index_attempt_errors(index_attempt_id, db_session)
    return [IndexAttemptError.from_db_model(e) for e in indexing_errors]
