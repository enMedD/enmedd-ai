export interface Settings {
  chat_page_enabled: boolean;
  search_page_enabled: boolean;
  default_page: "search" | "chat";
  maximum_chat_retention_days: number | null;
}

export interface Workspaces {
  workspace_name: string | null;
  workspace_description: string | null;
  use_custom_logo: boolean;

  // custom Chat components
  custom_header_logo: string | null;
  custom_header_content: string | null;
}

export interface FeatureFlags {
  profile_page: boolean;
  multi_teamspace: boolean;
  multi_workspace: boolean;
  query_history: boolean;
  whitelabelling: boolean;
  share_chat: boolean;
  explore_assistants: boolean;
  two_factor_auth: boolean;
}

export interface CombinedSettings {
  settings: Settings;
  featureFlags: FeatureFlags;
  workspaces: Workspaces | null;
  customAnalyticsScript: string | null;
}
