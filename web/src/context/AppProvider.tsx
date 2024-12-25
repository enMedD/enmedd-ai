"use server";
import {
  CombinedSettings,
  FeatureFlags,
} from "@/app/admin/settings/interfaces";
import { AssistantsProvider } from "./AssistantsContext";
import { Assistant } from "@/app/admin/assistants/interfaces";
import { User } from "@/lib/types";
import { FeatureFlagProvider } from "@/components/feature_flag/FeatureFlagContext";
import { UserProvider } from "@/components/user/UserProvider";
import { ProviderContextProvider } from "@/components/chat_search/ProviderContext";
import { SettingsProvider } from "@/components/settings/SettingsProvider";
import { Toaster } from "@/components/ui/toaster";
import ThemeProvider from "@/components/ThemeProvider";
import PageSwitcher from "@/components/PageSwitcher";

interface AppProviderProps {
  children: React.ReactNode;
  user: User | null;
  settings: CombinedSettings;
  assistants: Assistant[];
  hasAnyConnectors: boolean;
  hasImageCompatibleModel: boolean;
  featureFlags: FeatureFlags;
}

export const AppProvider = ({
  children,
  user,
  settings,
  assistants,
  hasAnyConnectors,
  hasImageCompatibleModel,
  featureFlags,
}: AppProviderProps) => {
  return (
    <FeatureFlagProvider flags={featureFlags}>
      <UserProvider>
        <ProviderContextProvider>
          <SettingsProvider settings={settings}>
            <AssistantsProvider
              initialAssistants={assistants}
              hasAnyConnectors={hasAnyConnectors}
              hasImageCompatibleModel={hasImageCompatibleModel}
            >
              <ThemeProvider />
              {children}
              <Toaster />
              <PageSwitcher />
            </AssistantsProvider>
          </SettingsProvider>
        </ProviderContextProvider>
      </UserProvider>
    </FeatureFlagProvider>
  );
};
