from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field
from pydantic import field_validator
from pydantic import model_validator

from enmedd.auth.schemas import UserRole
from enmedd.configs.app_configs import TRACK_EXTERNAL_IDP_EXPIRY
from enmedd.configs.constants import AuthType
from enmedd.enmedddbot.slack.config import VALID_SLACK_FILTERS
from enmedd.db.models import AllowedAnswerFilters
from enmedd.db.models import ChannelConfig
from enmedd.db.models import SlackBotConfig as SlackBotConfigModel
from enmedd.db.models import SlackBotResponseType
from enmedd.db.models import User
from enmedd.search.models import SavedSearchSettings
from enmedd.server.features.assistant.models import AssistantSnapshot
from enmedd.server.models import FullUserSnapshot
from enmedd.server.models import InvitedUserSnapshot
from ee.enmedd.server.manage.models import StandardAnswerCategory


if TYPE_CHECKING:
    pass


class VersionResponse(BaseModel):
    backend_version: str


class AuthTypeResponse(BaseModel):
    auth_type: AuthType
    # specifies whether the current auth setup requires
    # users to have verified emails
    requires_verification: bool


class UserPreferences(BaseModel):
    chosen_assistants: list[int] | None = None
    hidden_assistants: list[int] = []
    visible_assistants: list[int] = []

    default_model: str | None = None


class UserInfo(BaseModel):
    id: str
    email: str
    is_active: bool
    is_superuser: bool
    is_verified: bool
    role: UserRole
    preferences: UserPreferences
    oidc_expiry: datetime | None = None
    current_token_created_at: datetime | None = None
    current_token_expiry_length: int | None = None

    @classmethod
    def from_model(
        cls,
        user: User,
        current_token_created_at: datetime | None = None,
        expiry_length: int | None = None,
    ) -> "UserInfo":
        return cls(
            id=str(user.id),
            email=user.email,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            is_verified=user.is_verified,
            role=user.role,
            preferences=(
                UserPreferences(
                    chosen_assistants=user.chosen_assistants,
                    default_model=user.default_model,
                    hidden_assistants=user.hidden_assistants,
                    visible_assistants=user.visible_assistants,
                )
            ),
            # set to None if TRACK_EXTERNAL_IDP_EXPIRY is False so that we avoid cases
            # where they previously had this set + used OIDC, and now they switched to
            # basic auth are now constantly getting redirected back to the login page
            # since their "oidc_expiry is old"
            oidc_expiry=user.oidc_expiry if TRACK_EXTERNAL_IDP_EXPIRY else None,
            current_token_created_at=current_token_created_at,
            current_token_expiry_length=expiry_length,
        )


class UserByEmail(BaseModel):
    user_email: str


class UserRoleUpdateRequest(BaseModel):
    user_email: str
    new_role: UserRole


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


class SlackBotTokens(BaseModel):
    bot_token: str
    app_token: str
    model_config = ConfigDict(frozen=True)


class SlackBotConfigCreationRequest(BaseModel):
    # currently, a assistant is created for each slack bot config
    # in the future, `document_sets` will probably be replaced
    # by an optional `AssistantSnapshot` object. Keeping it like this
    # for now for simplicity / speed of development
    document_sets: list[int] | None = None
    assistant_id: (
        int | None
    ) = None  # NOTE: only one of `document_sets` / `assistant_id` should be set
    channel_names: list[str]
    respond_tag_only: bool = False
    respond_to_bots: bool = False
    enable_auto_filters: bool = False
    # If no team members, assume respond in the channel to everyone
    respond_member_group_list: list[str] = Field(default_factory=list)
    answer_filters: list[AllowedAnswerFilters] = Field(default_factory=list)
    # list of user emails
    follow_up_tags: list[str] | None = None
    response_type: SlackBotResponseType
    # XXX this is going away soon
    standard_answer_categories: list[int] = Field(default_factory=list)

    @field_validator("answer_filters", mode="before")
    @classmethod
    def validate_filters(cls, value: list[str]) -> list[str]:
        if any(test not in VALID_SLACK_FILTERS for test in value):
            raise ValueError(
                f"Slack Answer filters must be one of {VALID_SLACK_FILTERS}"
            )
        return value

    @model_validator(mode="after")
    def validate_document_sets_and_assistant_id(self) -> "SlackBotConfigCreationRequest":
        if self.document_sets and self.assistant_id:
            raise ValueError("Only one of `document_sets` / `assistant_id` should be set")

        return self


class SlackBotConfig(BaseModel):
    id: int
    assistant: AssistantSnapshot | None
    channel_config: ChannelConfig
    response_type: SlackBotResponseType
    # XXX this is going away soon
    standard_answer_categories: list[StandardAnswerCategory]
    enable_auto_filters: bool

    @classmethod
    def from_model(
        cls, slack_bot_config_model: SlackBotConfigModel
    ) -> "SlackBotConfig":
        return cls(
            id=slack_bot_config_model.id,
            assistant=(
                AssistantSnapshot.from_model(
                    slack_bot_config_model.assistant, allow_deleted=True
                )
                if slack_bot_config_model.assistant
                else None
            ),
            channel_config=slack_bot_config_model.channel_config,
            response_type=slack_bot_config_model.response_type,
            # XXX this is going away soon
            standard_answer_categories=[
                StandardAnswerCategory.from_model(standard_answer_category_model)
                for standard_answer_category_model in slack_bot_config_model.standard_answer_categories
            ],
            enable_auto_filters=slack_bot_config_model.enable_auto_filters,
        )


class FullModelVersionResponse(BaseModel):
    current_settings: SavedSearchSettings
    secondary_settings: SavedSearchSettings | None


class AllUsersResponse(BaseModel):
    accepted: list[FullUserSnapshot]
    invited: list[InvitedUserSnapshot]
    accepted_pages: int
    invited_pages: int
