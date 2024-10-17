from enum import Enum
from typing import Optional

from pydantic import BaseModel

from enmedd.db.models import TeamspaceSettings


class PageType(str, Enum):
    CHAT = "chat"
    SEARCH = "search"


class Setting(BaseModel):
    """General settings"""

    chat_page_enabled: bool = True
    search_page_enabled: bool = True
    chat_history_enabled: Optional[bool] = None
    default_page: PageType = PageType.CHAT
    maximum_chat_retention_days: int | None = None

    def check_validity(self) -> None:
        chat_page_enabled = self.chat_page_enabled
        search_page_enabled = self.search_page_enabled
        default_page = self.default_page

        if chat_page_enabled is False and search_page_enabled is False:
            raise ValueError(
                "One of `search_page_enabled` and `chat_page_enabled` must be True."
            )

        if default_page == PageType.CHAT and chat_page_enabled is False:
            raise ValueError(
                "The default page cannot be 'chat' if the chat page is disabled."
            )

        if default_page == PageType.SEARCH and search_page_enabled is False:
            raise ValueError(
                "The default page cannot be 'search' if the search page is disabled."
            )


class TeamspaceSettings(BaseModel):
    chat_page_enabled: Optional[bool] = None
    search_page_enabled: Optional[bool] = None
    chat_history_enabled: Optional[bool] = None
    default_page: PageType = PageType.CHAT
    maximum_chat_retention_days: Optional[int] = None

    @classmethod
    def from_db(cls, settings_model: TeamspaceSettings) -> "TeamspaceSettings":
        return cls(
            chat_page_enabled=settings_model.chat_page_enabled,
            search_page_enabled=settings_model.search_page_enabled,
            chat_history_enabled=settings_model.chat_history_enabled,
            default_page=settings_model.default_page,
            maximum_chat_retention_days=settings_model.maximum_chat_retention_days,
        )
