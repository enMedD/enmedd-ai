import {
  AuthTypeMetadata,
  getAuthTypeMetadataSS,
  getCurrentUserSS,
} from "@/lib/userSS";
import { CombinedSettings } from "@/app/admin/settings/interfaces";
import { FullEmbeddingModelResponse } from "@/components/embedding/interfaces";
import { fetchSettingsSS } from "@/components/settings/lib";
import Sidebar from "@/components/Sidebar";
import { User } from "@/lib/types";
import { fetchSS } from "@/lib/utilsSS";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <Sidebar
      user={user}
      sidebar={
        <div className="p-6 w-full">
          <Link href="/discovery/workspaces/settings" passHref>
            <Button className="w-full">Settings</Button>
          </Link>
        </div>
      }
    >
      {children}
    </Sidebar>
  );
}
