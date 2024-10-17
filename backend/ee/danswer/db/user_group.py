from collections.abc import Sequence
from operator import and_
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import delete
from sqlalchemy import func
from sqlalchemy import Select
from sqlalchemy import select
from sqlalchemy import update
from sqlalchemy.orm import Session

from enmedd.db.connector_credential_pair import get_connector_credential_pair_from_id
from enmedd.db.enums import ConnectorCredentialPairStatus
from enmedd.db.models import ConnectorCredentialPair
from enmedd.db.models import Credential__Teamspace
from enmedd.db.models import Document
from enmedd.db.models import DocumentByConnectorCredentialPair
from enmedd.db.models import DocumentSet__Teamspace
from enmedd.db.models import LLMProvider__Teamspace
from enmedd.db.models import Assistant__Teamspace
from enmedd.db.models import TokenRateLimit__Teamspace
from enmedd.db.models import User
from enmedd.db.models import User__Teamspace
from enmedd.db.models import Teamspace
from enmedd.db.models import Teamspace__ConnectorCredentialPair
from enmedd.db.models import UserRole
from enmedd.db.users import fetch_user_by_id
from enmedd.utils.logger import setup_logger
from ee.enmedd.server.teamspace.models import SetCuratorRequest
from ee.enmedd.server.teamspace.models import TeamspaceCreate
from ee.enmedd.server.teamspace.models import TeamspaceUpdate

logger = setup_logger()


def _cleanup_user__teamspace_relationships__no_commit(
    db_session: Session,
    teamspace_id: int,
    user_ids: list[UUID] | None = None,
) -> None:
    """NOTE: does not commit the transaction."""
    where_clause = User__Teamspace.teamspace_id == teamspace_id
    if user_ids:
        where_clause &= User__Teamspace.user_id.in_(user_ids)

    user__teamspace_relationships = db_session.scalars(
        select(User__Teamspace).where(where_clause)
    ).all()
    for user__teamspace_relationship in user__teamspace_relationships:
        db_session.delete(user__teamspace_relationship)


def _cleanup_credential__teamspace_relationships__no_commit(
    db_session: Session,
    teamspace_id: int,
) -> None:
    """NOTE: does not commit the transaction."""
    db_session.query(Credential__Teamspace).filter(
        Credential__Teamspace.teamspace_id == teamspace_id
    ).delete(synchronize_session=False)


def _cleanup_llm_provider__teamspace_relationships__no_commit(
    db_session: Session, teamspace_id: int
) -> None:
    """NOTE: does not commit the transaction."""
    db_session.query(LLMProvider__Teamspace).filter(
        LLMProvider__Teamspace.teamspace_id == teamspace_id
    ).delete(synchronize_session=False)


def _cleanup_assistant__teamspace_relationships__no_commit(
    db_session: Session, teamspace_id: int
) -> None:
    """NOTE: does not commit the transaction."""
    db_session.query(Assistant__Teamspace).filter(
        Assistant__Teamspace.teamspace_id == teamspace_id
    ).delete(synchronize_session=False)


def _cleanup_token_rate_limit__teamspace_relationships__no_commit(
    db_session: Session, teamspace_id: int
) -> None:
    """NOTE: does not commit the transaction."""
    token_rate_limit__teamspace_relationships = db_session.scalars(
        select(TokenRateLimit__Teamspace).where(
            TokenRateLimit__Teamspace.teamspace_id == teamspace_id
        )
    ).all()
    for (
        token_rate_limit__teamspace_relationship
    ) in token_rate_limit__teamspace_relationships:
        db_session.delete(token_rate_limit__teamspace_relationship)


def _cleanup_teamspace__cc_pair_relationships__no_commit(
    db_session: Session, teamspace_id: int, outdated_only: bool
) -> None:
    """NOTE: does not commit the transaction."""
    stmt = select(Teamspace__ConnectorCredentialPair).where(
        Teamspace__ConnectorCredentialPair.teamspace_id == teamspace_id
    )
    if outdated_only:
        stmt = stmt.where(
            Teamspace__ConnectorCredentialPair.is_current == False  # noqa: E712
        )
    teamspace__cc_pair_relationships = db_session.scalars(stmt)
    for teamspace__cc_pair_relationship in teamspace__cc_pair_relationships:
        db_session.delete(teamspace__cc_pair_relationship)


def _cleanup_document_set__teamspace_relationships__no_commit(
    db_session: Session, teamspace_id: int
) -> None:
    """NOTE: does not commit the transaction."""
    db_session.execute(
        delete(DocumentSet__Teamspace).where(
            DocumentSet__Teamspace.teamspace_id == teamspace_id
        )
    )


def validate_user_creation_permissions(
    db_session: Session,
    user: User | None,
    target_group_ids: list[int] | None,
    object_is_public: bool | None,
) -> None:
    """
    All admin actions are allowed.
    Prevents non-admins from creating/editing:
    - public objects
    - objects with no groups
    - objects that belong to a group they don't curate
    """
    if not user or user.role == UserRole.ADMIN:
        return

    if object_is_public:
        detail = "User does not have permission to create public credentials"
        logger.error(detail)
        raise HTTPException(
            status_code=400,
            detail=detail,
        )
    if not target_group_ids:
        detail = "Curators must specify 1+ groups"
        logger.error(detail)
        raise HTTPException(
            status_code=400,
            detail=detail,
        )

    user_curated_groups = fetch_teamspaces_for_user(
        db_session=db_session,
        user_id=user.id,
        # Global curators can curate all groups they are member of
        only_curator_groups=user.role != UserRole.GLOBAL_CURATOR,
    )
    user_curated_group_ids = set([group.id for group in user_curated_groups])
    target_group_ids_set = set(target_group_ids)
    if not target_group_ids_set.issubset(user_curated_group_ids):
        detail = "Curators cannot control groups they don't curate"
        logger.error(detail)
        raise HTTPException(
            status_code=400,
            detail=detail,
        )


def fetch_teamspace(db_session: Session, teamspace_id: int) -> Teamspace | None:
    stmt = select(Teamspace).where(Teamspace.id == teamspace_id)
    return db_session.scalar(stmt)


def fetch_teamspaces(
    db_session: Session, only_up_to_date: bool = True
) -> Sequence[Teamspace]:
    """
    Fetches user groups from the database.

    This function retrieves a sequence of `Teamspace` objects from the database.
    If `only_up_to_date` is set to `True`, it filters the user groups to return only those
    that are marked as up-to-date (`is_up_to_date` is `True`).

    Args:
        db_session (Session): The SQLAlchemy session used to query the database.
        only_up_to_date (bool, optional): Flag to determine whether to filter the results
            to include only up to date user groups. Defaults to `True`.

    Returns:
        Sequence[Teamspace]: A sequence of `Teamspace` objects matching the query criteria.
    """
    stmt = select(Teamspace)
    if only_up_to_date:
        stmt = stmt.where(Teamspace.is_up_to_date == True)  # noqa: E712
    return db_session.scalars(stmt).all()


def fetch_teamspaces_for_user(
    db_session: Session, user_id: UUID, only_curator_groups: bool = False
) -> Sequence[Teamspace]:
    stmt = (
        select(Teamspace)
        .join(User__Teamspace, User__Teamspace.teamspace_id == Teamspace.id)
        .join(User, User.id == User__Teamspace.user_id)  # type: ignore
        .where(User.id == user_id)  # type: ignore
    )
    if only_curator_groups:
        stmt = stmt.where(User__Teamspace.is_curator == True)  # noqa: E712
    return db_session.scalars(stmt).all()


def construct_document_select_by_teamspace(
    teamspace_id: int,
) -> Select:
    """This returns a statement that should be executed using
    .yield_per() to minimize overhead. The primary consumers of this function
    are background processing task generators."""
    stmt = (
        select(Document)
        .join(
            DocumentByConnectorCredentialPair,
            Document.id == DocumentByConnectorCredentialPair.id,
        )
        .join(
            ConnectorCredentialPair,
            and_(
                DocumentByConnectorCredentialPair.connector_id
                == ConnectorCredentialPair.connector_id,
                DocumentByConnectorCredentialPair.credential_id
                == ConnectorCredentialPair.credential_id,
            ),
        )
        .join(
            Teamspace__ConnectorCredentialPair,
            Teamspace__ConnectorCredentialPair.cc_pair_id == ConnectorCredentialPair.id,
        )
        .join(
            Teamspace,
            Teamspace__ConnectorCredentialPair.teamspace_id == Teamspace.id,
        )
        .where(Teamspace.id == teamspace_id)
        .order_by(Document.id)
    )
    stmt = stmt.distinct()
    return stmt


def fetch_documents_for_teamspace_paginated(
    db_session: Session,
    teamspace_id: int,
    last_document_id: str | None = None,
    limit: int = 100,
) -> tuple[Sequence[Document], str | None]:
    stmt = (
        select(Document)
        .join(
            DocumentByConnectorCredentialPair,
            Document.id == DocumentByConnectorCredentialPair.id,
        )
        .join(
            ConnectorCredentialPair,
            and_(
                DocumentByConnectorCredentialPair.connector_id
                == ConnectorCredentialPair.connector_id,
                DocumentByConnectorCredentialPair.credential_id
                == ConnectorCredentialPair.credential_id,
            ),
        )
        .join(
            Teamspace__ConnectorCredentialPair,
            Teamspace__ConnectorCredentialPair.cc_pair_id == ConnectorCredentialPair.id,
        )
        .join(
            Teamspace,
            Teamspace__ConnectorCredentialPair.teamspace_id == Teamspace.id,
        )
        .where(Teamspace.id == teamspace_id)
        .order_by(Document.id)
        .limit(limit)
    )
    if last_document_id is not None:
        stmt = stmt.where(Document.id > last_document_id)
    stmt = stmt.distinct()

    documents = db_session.scalars(stmt).all()
    return documents, documents[-1].id if documents else None


def fetch_teamspaces_for_documents(
    db_session: Session,
    document_ids: list[str],
) -> Sequence[tuple[str, list[str]]]:
    stmt = (
        select(Document.id, func.array_agg(Teamspace.name))
        .join(
            Teamspace__ConnectorCredentialPair,
            Teamspace.id == Teamspace__ConnectorCredentialPair.teamspace_id,
        )
        .join(
            ConnectorCredentialPair,
            ConnectorCredentialPair.id == Teamspace__ConnectorCredentialPair.cc_pair_id,
        )
        .join(
            DocumentByConnectorCredentialPair,
            and_(
                DocumentByConnectorCredentialPair.connector_id
                == ConnectorCredentialPair.connector_id,
                DocumentByConnectorCredentialPair.credential_id
                == ConnectorCredentialPair.credential_id,
            ),
        )
        .join(Document, Document.id == DocumentByConnectorCredentialPair.id)
        .where(Document.id.in_(document_ids))
        .where(Teamspace__ConnectorCredentialPair.is_current == True)  # noqa: E712
        # don't include CC pairs that are being deleted
        # NOTE: CC pairs can never go from DELETING to any other state -> it's safe to ignore them
        .where(ConnectorCredentialPair.status != ConnectorCredentialPairStatus.DELETING)
        .group_by(Document.id)
    )

    return db_session.execute(stmt).all()  # type: ignore


def _check_teamspace_is_modifiable(teamspace: Teamspace) -> None:
    if not teamspace.is_up_to_date:
        raise ValueError(
            "Specified user group is currently syncing. Wait until the current "
            "sync has finished before editing."
        )


def _add_user__teamspace_relationships__no_commit(
    db_session: Session, teamspace_id: int, user_ids: list[UUID]
) -> list[User__Teamspace]:
    """NOTE: does not commit the transaction."""
    relationships = [
        User__Teamspace(user_id=user_id, teamspace_id=teamspace_id)
        for user_id in user_ids
    ]
    db_session.add_all(relationships)
    return relationships


def _add_teamspace__cc_pair_relationships__no_commit(
    db_session: Session, teamspace_id: int, cc_pair_ids: list[int]
) -> list[Teamspace__ConnectorCredentialPair]:
    """NOTE: does not commit the transaction."""
    relationships = [
        Teamspace__ConnectorCredentialPair(
            teamspace_id=teamspace_id, cc_pair_id=cc_pair_id
        )
        for cc_pair_id in cc_pair_ids
    ]
    db_session.add_all(relationships)
    return relationships


def insert_teamspace(db_session: Session, teamspace: TeamspaceCreate) -> Teamspace:
    db_teamspace = Teamspace(name=teamspace.name)
    db_session.add(db_teamspace)
    db_session.flush()  # give the group an ID

    _add_user__teamspace_relationships__no_commit(
        db_session=db_session,
        teamspace_id=db_teamspace.id,
        user_ids=teamspace.user_ids,
    )
    _add_teamspace__cc_pair_relationships__no_commit(
        db_session=db_session,
        teamspace_id=db_teamspace.id,
        cc_pair_ids=teamspace.cc_pair_ids,
    )

    db_session.commit()
    return db_teamspace


def _mark_teamspace__cc_pair_relationships_outdated__no_commit(
    db_session: Session, teamspace_id: int
) -> None:
    """NOTE: does not commit the transaction."""
    teamspace__cc_pair_relationships = db_session.scalars(
        select(Teamspace__ConnectorCredentialPair).where(
            Teamspace__ConnectorCredentialPair.teamspace_id == teamspace_id
        )
    )
    for teamspace__cc_pair_relationship in teamspace__cc_pair_relationships:
        teamspace__cc_pair_relationship.is_current = False


def _validate_curator_status__no_commit(
    db_session: Session,
    users: list[User],
) -> None:
    for user in users:
        # Check if the user is a curator in any of their groups
        curator_relationships = (
            db_session.query(User__Teamspace)
            .filter(
                User__Teamspace.user_id == user.id,
                User__Teamspace.is_curator == True,  # noqa: E712
            )
            .all()
        )

        if curator_relationships:
            user.role = UserRole.CURATOR
        elif user.role == UserRole.CURATOR:
            user.role = UserRole.BASIC
        db_session.add(user)


def remove_curator_status__no_commit(db_session: Session, user: User) -> None:
    stmt = (
        update(User__Teamspace)
        .where(User__Teamspace.user_id == user.id)
        .values(is_curator=False)
    )
    db_session.execute(stmt)
    _validate_curator_status__no_commit(db_session, [user])


def update_user_curator_relationship(
    db_session: Session,
    teamspace_id: int,
    set_curator_request: SetCuratorRequest,
) -> None:
    user = fetch_user_by_id(db_session, set_curator_request.user_id)
    if not user:
        raise ValueError(f"User with id '{set_curator_request.user_id}' not found")
    requested_teamspaces = fetch_teamspaces_for_user(
        db_session=db_session,
        user_id=set_curator_request.user_id,
        only_curator_groups=False,
    )

    group_ids = [group.id for group in requested_teamspaces]
    if teamspace_id not in group_ids:
        raise ValueError(f"user is not in group '{teamspace_id}'")

    relationship_to_update = (
        db_session.query(User__Teamspace)
        .filter(
            User__Teamspace.teamspace_id == teamspace_id,
            User__Teamspace.user_id == set_curator_request.user_id,
        )
        .first()
    )

    if relationship_to_update:
        relationship_to_update.is_curator = set_curator_request.is_curator
    else:
        relationship_to_update = User__Teamspace(
            teamspace_id=teamspace_id,
            user_id=set_curator_request.user_id,
            is_curator=True,
        )
        db_session.add(relationship_to_update)

    _validate_curator_status__no_commit(db_session, [user])
    db_session.commit()


def update_teamspace(
    db_session: Session,
    user: User | None,
    teamspace_id: int,
    teamspace_update: TeamspaceUpdate,
) -> Teamspace:
    """If successful, this can set db_teamspace.is_up_to_date = False.
    That will be processed by check_for_vespa_teamspaces_sync_task and trigger
    a long running background sync to Vespa.
    """
    stmt = select(Teamspace).where(Teamspace.id == teamspace_id)
    db_teamspace = db_session.scalar(stmt)
    if db_teamspace is None:
        raise ValueError(f"Teamspace with id '{teamspace_id}' not found")

    _check_teamspace_is_modifiable(db_teamspace)

    current_user_ids = set([user.id for user in db_teamspace.users])
    updated_user_ids = set(teamspace_update.user_ids)
    added_user_ids = list(updated_user_ids - current_user_ids)
    removed_user_ids = list(current_user_ids - updated_user_ids)

    # LEAVING THIS HERE FOR NOW FOR GIVING DIFFERENT ROLES
    # ACCESS TO DIFFERENT PERMISSIONS
    # if (removed_user_ids or added_user_ids) and (
    #     not user or user.role != UserRole.ADMIN
    # ):
    #     raise ValueError("Only admins can add or remove users from user groups")

    if removed_user_ids:
        _cleanup_user__teamspace_relationships__no_commit(
            db_session=db_session,
            teamspace_id=teamspace_id,
            user_ids=removed_user_ids,
        )

    if added_user_ids:
        _add_user__teamspace_relationships__no_commit(
            db_session=db_session,
            teamspace_id=teamspace_id,
            user_ids=added_user_ids,
        )

    cc_pairs_updated = set([cc_pair.id for cc_pair in db_teamspace.cc_pairs]) != set(
        teamspace_update.cc_pair_ids
    )
    if cc_pairs_updated:
        _mark_teamspace__cc_pair_relationships_outdated__no_commit(
            db_session=db_session, teamspace_id=teamspace_id
        )
        _add_teamspace__cc_pair_relationships__no_commit(
            db_session=db_session,
            teamspace_id=db_teamspace.id,
            cc_pair_ids=teamspace_update.cc_pair_ids,
        )

    # only needs to sync with Vespa if the cc_pairs have been updated
    if cc_pairs_updated:
        db_teamspace.is_up_to_date = False

    removed_users = db_session.scalars(
        select(User).where(User.id.in_(removed_user_ids))  # type: ignore
    ).unique()
    _validate_curator_status__no_commit(db_session, list(removed_users))
    db_session.commit()
    return db_teamspace


def prepare_teamspace_for_deletion(db_session: Session, teamspace_id: int) -> None:
    stmt = select(Teamspace).where(Teamspace.id == teamspace_id)
    db_teamspace = db_session.scalar(stmt)
    if db_teamspace is None:
        raise ValueError(f"Teamspace with id '{teamspace_id}' not found")

    _check_teamspace_is_modifiable(db_teamspace)

    _mark_teamspace__cc_pair_relationships_outdated__no_commit(
        db_session=db_session, teamspace_id=teamspace_id
    )

    _cleanup_credential__teamspace_relationships__no_commit(
        db_session=db_session, teamspace_id=teamspace_id
    )
    _cleanup_user__teamspace_relationships__no_commit(
        db_session=db_session, teamspace_id=teamspace_id
    )
    _cleanup_token_rate_limit__teamspace_relationships__no_commit(
        db_session=db_session, teamspace_id=teamspace_id
    )
    _cleanup_document_set__teamspace_relationships__no_commit(
        db_session=db_session, teamspace_id=teamspace_id
    )
    _cleanup_assistant__teamspace_relationships__no_commit(
        db_session=db_session, teamspace_id=teamspace_id
    )
    _cleanup_teamspace__cc_pair_relationships__no_commit(
        db_session=db_session,
        teamspace_id=teamspace_id,
        outdated_only=False,
    )
    _cleanup_llm_provider__teamspace_relationships__no_commit(
        db_session=db_session, teamspace_id=teamspace_id
    )

    db_teamspace.is_up_to_date = False
    db_teamspace.is_up_for_deletion = True
    db_session.commit()


def delete_teamspace(db_session: Session, teamspace: Teamspace) -> None:
    """
    This assumes that all the fk cleanup has already been done.
    """
    db_session.delete(teamspace)
    db_session.commit()


def mark_teamspace_as_synced(db_session: Session, teamspace: Teamspace) -> None:
    # cleanup outdated relationships
    _cleanup_teamspace__cc_pair_relationships__no_commit(
        db_session=db_session, teamspace_id=teamspace.id, outdated_only=True
    )
    teamspace.is_up_to_date = True
    db_session.commit()


def delete_teamspace_cc_pair_relationship__no_commit(
    cc_pair_id: int, db_session: Session
) -> None:
    """Deletes all rows from Teamspace__ConnectorCredentialPair where the
    connector_credential_pair_id matches the given cc_pair_id.

    Should be used very carefully (only for connectors that are being deleted)."""
    cc_pair = get_connector_credential_pair_from_id(cc_pair_id, db_session)
    if not cc_pair:
        raise ValueError(f"Connector Credential Pair '{cc_pair_id}' does not exist")

    if cc_pair.status != ConnectorCredentialPairStatus.DELETING:
        raise ValueError(
            f"Connector Credential Pair '{cc_pair_id}' is not in the DELETING state. status={cc_pair.status}"
        )

    delete_stmt = delete(Teamspace__ConnectorCredentialPair).where(
        Teamspace__ConnectorCredentialPair.cc_pair_id == cc_pair_id,
    )
    db_session.execute(delete_stmt)
