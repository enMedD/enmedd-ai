import { CombinedSettings } from "@/app/admin/settings/interfaces";
import { FullEmbeddingModelResponse } from "@/components/embedding/interfaces";
import { fetchSettingsSS } from "@/components/settings/lib";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { User } from "@/lib/types";
import {
  AuthTypeMetadata,
  getAuthTypeMetadataSS,
  getCurrentUserSS,
} from "@/lib/userSS";
import { fetchSS } from "@/lib/utilsSS";
import { Cpu, File, Plus, Shield, Users } from "lucide-react";
import { redirect } from "next/navigation";

export default async function DiscoveryPage() {
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
    <Sidebar user={user} sidebar={<div></div>}>
      <div className="container space-y-10">
        <div className="w-full flex justify-between items-center">
          <h1 className="flex items-center font-bold text-xl md:text-[28px] text-strong gap-x-2">
            Workspace Management
          </h1>
          <Button>
            <Plus size={16} />
            Create Workspace
          </Button>
        </div>

        <div className="w-full flex items-center justify-center">
          <Input placeholder="Search workspace..." className="w-3/4" />
        </div>

        <div className="flex flex-wrap gap-6 pt-10">
          <Card className="overflow-hidden !rounded-xl cursor-pointer w-full max-w-[400px] justify-start items-start">
            <CardHeader className="p-10 bg-brand-500"></CardHeader>
            <CardContent className="relative flex flex-col justify-between min-h-48 bg-muted/50">
              <div className="absolute top-0 w-12 h-12 -translate-y-1/2 right-4 flex items-center justify-center">
                <span className="text-xl uppercase font-bold h-full flex items-center justify-center rounded-lg text-inverted border-[5px] border-inverted w-full bg-brand-500">
                  L
                </span>
              </div>
              <div className="pb-6">
                <h2 className="w-full font-bold truncate flex">
                  <span className="inline truncate">Legendary Name</span>
                </h2>
                <span className="text-sm text-subtle">John Doe</span>
              </div>

              <div className="w-full grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] text-sm gap-y-2 gap-x-6 font-light">
                <div className="flex items-center gap-2">
                  <Users size={16} className="shrink-0" />
                  <span className="whitespace-nowrap">10 Members</span>
                </div>

                <div className="flex items-center gap-2">
                  <Cpu size={16} className="shrink-0" />
                  <span className="whitespace-nowrap">10 Assistant</span>
                </div>

                <div className="flex items-center gap-2">
                  <File size={16} className="shrink-0" />
                  <span className="whitespace-nowrap">10 Document Set</span>
                </div>

                <div className="flex items-center gap-2">
                  <Shield size={16} className="shrink-0" />
                  <span className="whitespace-nowrap">10 Data Source</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Sidebar>
  );
}
