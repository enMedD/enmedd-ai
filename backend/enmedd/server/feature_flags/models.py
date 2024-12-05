from pydantic import BaseModel

from enmedd.key_value_store.factory import get_kv_store
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
        except TypeError:
            return {}

    def update_overall_feature(features: FeatureFlags):
        logger.info(f"Updating feature flags: {features}")
        get_kv_store().store(_FEATURE_FLAG_KEY, features.model_dump())

    def store_feature(feature: str, value: bool):
        existing_features = FeatureFlagsManager.get_all_features()
        existing_features.update({feature: value})
        FeatureFlagsManager.update_overall_feature(existing_features)
