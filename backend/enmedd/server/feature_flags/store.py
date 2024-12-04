from fastapi import Depends

from enmedd.auth.users import current_workspace_admin_user
from enmedd.db.models import User
from enmedd.server.feature_flags.models import FeatureFlags
from enmedd.server.feature_flags.models import FeatureFlagsManager
from enmedd.utils.logger import setup_logger

logger = setup_logger()


def load_feature_flags() -> FeatureFlags:
    return FeatureFlags(**FeatureFlagsManager.get_all_features())


def store_feature_flags(
    feature_flag: FeatureFlags, _: User | None = Depends(current_workspace_admin_user)
) -> None:
    FeatureFlagsManager.update_overall_feature(feature_flag.model_dump())
