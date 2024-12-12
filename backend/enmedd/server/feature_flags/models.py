from functools import wraps

from fastapi import HTTPException
from pydantic import BaseModel

from enmedd.key_value_store.factory import get_kv_store
from enmedd.key_value_store.interface import KvKeyNotFoundError
from enmedd.utils.logger import setup_logger


_FEATURE_FLAG_KEY = "enmedd_feature_flag"

logger = setup_logger()


class FeatureFlags(BaseModel):
    """Features Control"""

    profile_page: bool = True
    multi_teamspace: bool = True
    multi_workspace: bool = False
    query_history: bool = False
    whitelabelling: bool = True
    share_chat: bool = False
    explore_assistants: bool = False
    two_factor_auth: bool = True

    model_config = {"extra": "allow"}

    def check_validity(self) -> None:
        return


class FeatureFlagsManager:
    def __reload_features() -> dict:
        return get_kv_store().load(_FEATURE_FLAG_KEY)

    def is_feature_enabled(feature: str, default: bool = False) -> bool:
        try:
            features = FeatureFlagsManager.__reload_features()
            return not not features.get(feature)
        except TypeError:
            return default

    def get_all_features():
        try:
            return FeatureFlagsManager.__reload_features()
        except KvKeyNotFoundError:
            # Initialize the default feature flags. This is used when the feature flags are not set
            feature_flag = FeatureFlags()
            FeatureFlagsManager.update_overall_feature(feature_flag)
            return feature_flag.model_dump()

    def update_overall_feature(features: FeatureFlags):
        logger.info(f"Updating feature flags: {features}")
        get_kv_store().store(_FEATURE_FLAG_KEY, features.model_dump())

    def store_feature(feature: str, value: bool):
        existing_features = FeatureFlagsManager.get_all_features()
        existing_features.update({feature: value})
        FeatureFlagsManager.update_overall_feature(FeatureFlags(**existing_features))


def feature_flag(feature_name: str, default: bool = False):
    """Decorator to check if a feature flag is enabled"""

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            logger.info(f"Checking feature flag {feature_name}")

            # If the feature is not in the existing features, store it with the default value
            existing_features = FeatureFlagsManager.__reload_features()
            if feature_name not in existing_features:
                FeatureFlagsManager.store_feature(feature_name, default)

            # Check if the feature is enabled
            if FeatureFlagsManager.is_feature_enabled(feature_name, default):
                return func(*args, **kwargs)
            raise HTTPException(
                status_code=403, detail=f"The feature {feature_name}  is disabled"
            )

        return wrapper

    return decorator
