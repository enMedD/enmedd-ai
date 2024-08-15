from collections.abc import Mapping
from typing import Any
from typing import cast

from enmedd_ai.auth.schemas import UserRole
from enmedd_ai.dynamic_configs.store import ConfigNotFoundError
from enmedd_ai.dynamic_configs.store import DynamicConfigStore
from enmedd_ai.server.manage.models import UserInfo
from enmedd_ai.server.manage.models import UserPreferences


NO_AUTH_USER_PREFERENCES_KEY = "no_auth_user_preferences"


def set_no_auth_user_preferences(
    store: DynamicConfigStore, preferences: UserPreferences
) -> None:
    store.store(NO_AUTH_USER_PREFERENCES_KEY, preferences.dict())


def load_no_auth_user_preferences(store: DynamicConfigStore) -> UserPreferences:
    try:
        preferences_data = cast(
            Mapping[str, Any], store.load(NO_AUTH_USER_PREFERENCES_KEY)
        )
        return UserPreferences(**preferences_data)
    except ConfigNotFoundError:
        return UserPreferences(chosen_assistants=None)


def fetch_no_auth_user(store: DynamicConfigStore) -> UserInfo:
    return UserInfo(
        id="__no_auth_user__",
        email="anonymous@enmedd_ai.ai",
        is_active=True,
        is_superuser=False,
        is_verified=True,
        role=UserRole.ADMIN,
        preferences=load_no_auth_user_preferences(store),
    )
