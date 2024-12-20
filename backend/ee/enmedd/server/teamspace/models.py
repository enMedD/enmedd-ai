from enum import Enum
from typing import List
from typing import Optional
from uuid import UUID

from pydantic import BaseModel
from pydantic import field_validator

from enmedd.db.models import Teamspace as TeamspaceModel
from enmedd.server.documents.models import ConnectorCredentialPairDescriptor
from enmedd.server.documents.models import ConnectorSnapshot
from enmedd.server.documents.models import CredentialSnapshot
from enmedd.server.features.assistant.models import AssistantSnapshot
from enmedd.server.features.document_set.models import DocumentSet
from enmedd.server.manage.models import UserInfo
from enmedd.server.manage.models import UserPreferences
from enmedd.server.models import MinimalTeamspaceSnapshot
from enmedd.server.models import MinimalUserwithNameSnapshot
from enmedd.server.models import MinimalWorkspaceSnapshot
from enmedd.server.settings.models import TeamspaceSettings
from enmedd.server.token_rate_limits.models import TokenRateLimitDisplay


class Teamspace(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    creator: MinimalUserwithNameSnapshot
    users: list[UserInfo]
    cc_pairs: list[ConnectorCredentialPairDescriptor]
    document_sets: list[DocumentSet]
    assistants: list[AssistantSnapshot]
    is_up_to_date: bool
    is_up_for_deletion: bool
    logo: Optional[str] = None
    workspace: list[MinimalWorkspaceSnapshot]
    token_rate_limit: Optional[TokenRateLimitDisplay] = None
    settings: Optional[TeamspaceSettings] = None

    @classmethod
    def from_model(cls, teamspace_model: TeamspaceModel) -> "Teamspace":
        return cls(
            id=teamspace_model.id,
            name=teamspace_model.name,
            description=teamspace_model.description,
            creator=MinimalUserwithNameSnapshot(
                id=teamspace_model.creator.id,
                email=teamspace_model.creator.email,
                full_name=teamspace_model.creator.full_name,
                profile=teamspace_model.creator.profile,
            ),
            users=[
                UserInfo(
                    id=str(user.id),
                    email=user.email,
                    is_active=user.is_active,
                    is_superuser=user.is_superuser,
                    is_verified=user.is_verified,
                    profile=user.profile,
                    role=user.role,
                    preferences=UserPreferences(
                        chosen_assistants=user.chosen_assistants
                    ),
                    full_name=user.full_name,
                    company_name=user.company_name,
                    company_email=user.company_email,
                    company_billing=user.company_billing,
                    billing_email_address=user.billing_email_address,
                    vat=user.vat,
                )
                for user in teamspace_model.users
            ],
            cc_pairs=[
                ConnectorCredentialPairDescriptor(
                    id=cc_pair_relationship.cc_pair.id,
                    name=cc_pair_relationship.cc_pair.name,
                    connector=ConnectorSnapshot.from_connector_db_model(
                        cc_pair_relationship.cc_pair.connector
                    ),
                    credential=CredentialSnapshot.from_credential_db_model(
                        cc_pair_relationship.cc_pair.credential
                    ),
                    groups=[
                        MinimalTeamspaceSnapshot(
                            id=group.id,
                            name=group.name,
                            workspace=[
                                MinimalWorkspaceSnapshot(
                                    id=workspace.id,
                                    workspace_name=workspace.workspace_name,
                                )
                                for workspace in group.workspace
                            ],
                        )
                        for group in cc_pair_relationship.cc_pair.groups
                    ],
                )
                for cc_pair_relationship in teamspace_model.cc_pair_relationships
                if cc_pair_relationship.is_current
            ],
            document_sets=[
                DocumentSet.from_model(ds) for ds in teamspace_model.document_sets
            ],
            assistants=[
                AssistantSnapshot.from_model(assistant)
                for assistant in teamspace_model.assistants
                if AssistantSnapshot.from_model(assistant) is not None
            ],
            is_up_to_date=teamspace_model.is_up_to_date,
            is_up_for_deletion=teamspace_model.is_up_for_deletion,
            logo=teamspace_model.logo,
            workspace=[
                MinimalWorkspaceSnapshot(
                    id=workspace.id, workspace_name=workspace.workspace_name
                )
                for workspace in teamspace_model.workspace
            ],
            token_rate_limit=(
                TokenRateLimitDisplay.from_db(teamspace_model.token_rate_limit)
                if teamspace_model.token_rate_limit is not None
                else None
            ),
            settings=(
                TeamspaceSettings.from_db(teamspace_model.settings)
                if teamspace_model.settings is not None
                else None
            ),
        )


class TeamspaceUserRole(str, Enum):
    BASIC = "basic"
    CREATOR = "creator"
    ADMIN = "admin"


class UserWithRole(BaseModel):
    user_id: UUID
    role: Optional[str] = TeamspaceUserRole.BASIC


class TeamspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    users: List[UserWithRole]
    cc_pair_ids: Optional[List[int]] = None
    document_set_ids: Optional[List[int]] = None
    assistant_ids: Optional[List[int]] = None
    workspace_id: Optional[int] = 0

    @field_validator("name", "description", mode="before")
    def strip_whitespace(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value


class TeamspaceUpdate(BaseModel):
    user_ids: list[UUID]
    cc_pair_ids: Optional[List[int]] = None
    document_set_ids: Optional[List[int]] = None
    assistant_ids: Optional[List[int]] = None


class TeamspaceUpdateName(BaseModel):
    name: str
    description: Optional[str] = None

    @field_validator("name", "description", mode="before")
    def strip_whitespace(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value


class UpdateUserRoleRequest(BaseModel):
    user_email: str
    new_role: TeamspaceUserRole

    @field_validator("user_email", mode="before")
    def strip_whitespace(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value
