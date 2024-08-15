from typing import Any
from typing import TYPE_CHECKING

from pydantic import BaseModel
from pydantic import root_validator
from pydantic import validator

from enmedd_ai.auth.schemas import UserRole
from enmedd_ai.configs.constants import AuthType
from enmedd_ai.db.models import AllowedAnswerFilters
from enmedd_ai.indexing.models import EmbeddingModelDetail
from enmedd_ai.server.features.persona.models import PersonaSnapshot
from enmedd_ai.server.models import FullUserSnapshot
from enmedd_ai.server.models import InvitedUserSnapshot

if TYPE_CHECKING:
    from enmedd_ai.db.models import User as UserModel


class VersionResponse(BaseModel):
    backend_version: str


class AuthTypeResponse(BaseModel):
    auth_type: AuthType
    # specifies whether the current auth setup requires
    # users to have verified emails
    requires_verification: bool


class UserPreferences(BaseModel):
    chosen_assistants: list[int] | None


class UserInfo(BaseModel):
    id: str
    email: str
    is_active: bool
    is_superuser: bool
    is_verified: bool
    role: UserRole
    preferences: UserPreferences

    @classmethod
    def from_model(cls, user: "UserModel") -> "UserInfo":
        return cls(
            id=str(user.id),
            email=user.email,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            is_verified=user.is_verified,
            role=user.role,
            preferences=(UserPreferences(chosen_assistants=user.chosen_assistants)),
        )


class UserByEmail(BaseModel):
    user_email: str


class UserRoleResponse(BaseModel):
    role: str


class BoostDoc(BaseModel):
    document_id: str
    semantic_id: str
    link: str
    boost: int
    hidden: bool


class BoostUpdateRequest(BaseModel):
    document_id: str
    boost: int


class HiddenUpdateRequest(BaseModel):
    document_id: str
    hidden: bool

class FullModelVersionResponse(BaseModel):
    current_model: EmbeddingModelDetail
    secondary_model: EmbeddingModelDetail | None


class AllUsersResponse(BaseModel):
    accepted: list[FullUserSnapshot]
    invited: list[InvitedUserSnapshot]
    accepted_pages: int
    invited_pages: int
