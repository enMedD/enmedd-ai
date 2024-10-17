import {
  CombinedSettings,
  Workspaces,
  FeatureFlags,
  GatingType,
  Settings,
} from "@/app/admin/settings/interfaces";
import {
  CUSTOM_ANALYTICS_ENABLED,
  SERVER_SIDE_ONLY__PAID_ENTERPRISE_FEATURES_ENABLED,
} from "@/lib/constants";
import { fetchSS } from "@/lib/utilsSS";
import { getWebVersion } from "@/lib/version";

export enum SettingsError {
  OTHER = "OTHER",
}

export async function fetchStandardSettingsSS() {
  return fetchSS("/settings");
}

export async function fetchFeatureFlagsSS() {
  return fetchSS("/ff");
}

export async function fetchWorkspaceSettingsSS() {
  return fetchSS("/workspace");
}

export async function fetchCustomAnalyticsScriptSS() {
  return fetchSS("/workspace/custom-analytics-script");
}

export async function fetchSettingsSS(): Promise<CombinedSettings | null> {
  const tasks = [fetchStandardSettingsSS(), fetchFeatureFlagsSS()];
  if (SERVER_SIDE_ONLY__PAID_ENTERPRISE_FEATURES_ENABLED) {
    tasks.push(fetchWorkspaceSettingsSS());
    if (CUSTOM_ANALYTICS_ENABLED) {
      tasks.push(fetchCustomAnalyticsScriptSS());
    }
  }

  try {
    const results = await Promise.all(tasks);

    let settings: Settings;
    if (!results[0].ok) {
      if (results[0].status === 403 || results[0].status === 401) {
        settings = {
          product_gating: GatingType.NONE,
          gpu_enabled: false,
          chat_page_enabled: true,
          search_page_enabled: true,
          default_page: "search",
          maximum_chat_retention_days: null,
          notifications: [],
          needs_reindexing: false,
        };
      } else {
        throw new Error(
          `fetchStandardSettingsSS failed: status=${results[0].status} body=${await results[0].text()}`
        );
      }
    } else {
      settings = await results[0].json();
    }
    const featureFlags = (await results[1].json()) as FeatureFlags;
    let workspaces: Workspaces | null = null;
    if (tasks.length > 2) {
      if (!results[2].ok) {
        if (results[2].status !== 403 && results[2].status !== 401) {
          throw new Error(
            `fetchEnterpriseSettingsSS failed: status=${results[2].status} body=${await results[1].text()}`
          );
        }
      } else {
        workspaces = await results[1].json();
      }
    }

    let customAnalyticsScript: string | null = null;
    if (tasks.length > 3) {
      if (!results[3].ok) {
        if (results[3].status !== 403) {
          throw new Error(
            `fetchCustomAnalyticsScriptSS failed: status=${results[3].status} body=${await results[2].text()}`
          );
        }
      } else {
        customAnalyticsScript = await results[2].json();
      }
    }

    const webVersion = getWebVersion();

    const combinedSettings: CombinedSettings = {
      settings,
      featureFlags,
      workspaces,
      customAnalyticsScript,
      webVersion,
    };

    return combinedSettings;
  } catch (error) {
    console.error("fetchSettingsSS exception: ", error);
    return null;
  }
}
