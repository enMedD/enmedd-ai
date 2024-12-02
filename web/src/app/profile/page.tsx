import { User } from "@/lib/types";
import {
  AuthTypeMetadata,
  getAuthTypeMetadataSS,
  getCurrentUserSS,
} from "@/lib/userSS";
import { redirect } from "next/navigation";
import { fetchSS } from "@/lib/utilsSS";
import Profile from "./profile";
import { fetchSettingsSS } from "@/components/settings/lib";
import { CombinedSettings } from "../admin/settings/interfaces";
import { FullEmbeddingModelResponse } from "@/components/embedding/interfaces";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { GlobalSidebar } from "@/components/globalSidebar/GlobalSidebar";

export default async function ProfilePage() {
  const tasks = [
    getAuthTypeMetadataSS(),
    fetchSettingsSS(),
    getCurrentUserSS(),
    fetchSS("/manage/indexing-status"),
    fetchSS("/manage/document-set"),
    fetchSS("/assistant"),
    fetchSS("/query/valid-tags"),
    fetchSS("/secondary-index/get-embedding-models"),
  ];

  let results: (
    | User
    | CombinedSettings
    | Response
    | AuthTypeMetadata
    | FullEmbeddingModelResponse
    | null
  )[] = [null, null, null, null, null, null];
  try {
    results = await Promise.all(tasks);
  } catch (e) {
    console.log(`Some fetch failed for the main search page - ${e}`);
  }

  const authTypeMetadata = results[0] as AuthTypeMetadata | null;
  const combinedSettings = results[1] as CombinedSettings | null;
  const user = results[2] as User | null;

  const authDisabled = authTypeMetadata?.authType === "disabled";

  if (!authDisabled && !user) {
    return redirect("/auth/login");
  }

  if (user && !user.is_verified && authTypeMetadata?.requiresVerification) {
    return redirect("/auth/waiting-on-verification");
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "56px",
        } as React.CSSProperties
      }
      className="h-full w-full"
    >
      <GlobalSidebar user={user} />
      <SidebarInset className="w-full overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 absolute top-0 lg:hidden">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="h-full w-full overflow-hidden overflow-y-auto">
          <Profile user={user} combinedSettings={combinedSettings} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
