from sqlalchemy.orm import Session

from enmedd_ai.configs.constants import DocumentSource
from enmedd_ai.db.models import Connector
from enmedd_ai.db.models import ConnectorCredentialPair
from enmedd_ai.utils.logger import setup_logger

logger = setup_logger()


def get_cc_pairs_by_source(
    source_type: DocumentSource,
    db_session: Session,
) -> list[ConnectorCredentialPair]:
    cc_pairs = (
        db_session.query(ConnectorCredentialPair)
        .join(ConnectorCredentialPair.connector)
        .filter(Connector.source == source_type)
        .all()
    )

    return cc_pairs
