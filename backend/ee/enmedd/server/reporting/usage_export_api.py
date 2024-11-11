from collections.abc import Generator
from datetime import datetime
from typing import Optional

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ee.enmedd.db.usage_export import get_all_usage_reports
from ee.enmedd.db.usage_export import get_usage_report_data
from ee.enmedd.db.usage_export import UsageReportMetadata
from ee.enmedd.server.reporting.usage_export_generation import create_new_usage_report
from enmedd.auth.users import current_admin_user
from enmedd.db.engine import get_session
from enmedd.db.models import User
from enmedd.file_store.constants import STANDARD_CHUNK_SIZE

router = APIRouter()


class GenerateUsageReportParams(BaseModel):
    period_from: str | None = None
    period_to: str | None = None


@router.post("/admin/generate-usage-report")
def generate_report(
    params: GenerateUsageReportParams,
    user: User = Depends(current_admin_user),
    db_session: Session = Depends(get_session),
    teamspace_id: Optional[int] = None,
) -> UsageReportMetadata:
    period = None
    if params.period_from and params.period_to:
        try:
            period = (
                datetime.fromisoformat(params.period_from),
                datetime.fromisoformat(params.period_to),
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    new_report = create_new_usage_report(
        db_session, user.id if user else None, period, teamspace_id
    )
    return new_report


@router.get("/admin/usage-report/{report_name}")
def read_usage_report(
    report_name: str,
    _: User | None = Depends(current_admin_user),
    db_session: Session = Depends(get_session),
) -> Response:
    try:
        file = get_usage_report_data(db_session, report_name)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    def iterfile() -> Generator[bytes, None, None]:
        while True:
            chunk = file.read(STANDARD_CHUNK_SIZE)
            if not chunk:
                break
            yield chunk

    return StreamingResponse(
        content=iterfile(),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={report_name}"},
    )


@router.get("/admin/usage-report")
def fetch_usage_reports(
    _: User | None = Depends(current_admin_user),
    db_session: Session = Depends(get_session),
    teamspace_id: Optional[int] = None,
) -> list[UsageReportMetadata]:
    try:
        return get_all_usage_reports(db_session, teamspace_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
