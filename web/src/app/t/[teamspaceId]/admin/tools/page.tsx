import { ToolSnapshot } from "@/lib/tools/interfaces";
import { fetchSS } from "@/lib/utilsSS";
import { ErrorCallout } from "@/components/ErrorCallout";
import { AdminPageTitle } from "@/components/admin/Title";
import { Wrench } from "lucide-react";
import { Main } from "@/app/admin/tools/Main";

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

        <Main teamspaceId={params.teamspaceId} />
      </div>
    </div>
  );
}
