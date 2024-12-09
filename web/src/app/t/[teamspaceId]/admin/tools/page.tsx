import { ToolSnapshot } from "@/lib/tools/interfaces";
import Link from "next/link";
import { fetchSS } from "@/lib/utilsSS";
import { ErrorCallout } from "@/components/ErrorCallout";
import { AdminPageTitle } from "@/components/admin/Title";
import { Button } from "@/components/ui/button";
import { SquarePlus, Wrench } from "lucide-react";
import { ToolsTable } from "@/app/admin/tools/ToolsTable";

export default async function Page({
  params,
}: {
  params: { teamspaceId: string };
}) {
  const toolResponse = await fetchSS("/tool");

  if (!toolResponse.ok) {
    return (
      <ErrorCallout
        errorTitle="Something went wrong :("
        errorMsg={`Failed to fetch tools - ${await toolResponse.text()}`}
      />
    );
  }

  const tools = (await toolResponse.json()) as ToolSnapshot[];

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container">
        <AdminPageTitle
          icon={<Wrench size={32} className="my-auto" />}
          title="Tools"
        />

        <p>Tools allow assistants to retrieve information or take actions.</p>

        <div className="pt-10">
          <h3 className="pb-2">Create a Tool</h3>
          <Link href={`/t/${params.teamspaceId}/admin/tools/new`}>
            <Button>
              <SquarePlus size={14} />
              New Tool
            </Button>
          </Link>
        </div>

        <div className="pt-10">
          <h3 className="pb-4">Existing Tools</h3>
          <ToolsTable tools={tools} teamspaceId={params.teamspaceId} />
        </div>
      </div>
    </div>
  );
}
