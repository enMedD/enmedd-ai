import json

import redis as rd
from pydantic import BaseModel


class FeatureFlagsManager:
    def __init__(self, redis_host="localhost", redis_port=6379, redis_db=0) -> None:
        self.db_key = "enmedd_kv_store:enmedd_feature_flag"
        self.redis_client = rd.Redis(redis_host, redis_port, redis_db)

    def __reload_features(self) -> dict:
        response: bytes = self.redis_client.get(self.db_key)
        return json.loads(response)

    def is_feature_enabled(self, feature: str, default: bool = False) -> bool:
        try:
            if self.redis_client.exists(self.db_key):
                parsed: dict = self.__reload_features()
                return not not parsed.get(feature)
            return default
        except TypeError:
            return default

    def get_all_features(self):
        try:
            return self.__reload_features()
        except TypeError:
            return {}

    def update_overall_feature(self, features: dict):
        current_features = self.get_all_features()
        current_features.update(features)
        self.redis_client.set(self.db_key, json.dumps(current_features).encode())

    def store_feature(self, feature: str, value: bool):
        try:
            if self.redis_client.exists(self.db_key):
                parsed = self.__reload_features()
                parsed.update({feature: value})
                self.redis_client.set(self.db_key, json.dumps(parsed).encode())
                return True

            self.redis_client.set(self.db_key, json.dumps({feature: value}).encode())
            return True
        except TypeError:
            return False

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
