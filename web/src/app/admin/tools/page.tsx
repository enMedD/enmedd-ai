import { ErrorCallout } from "@/components/ErrorCallout";
import { AdminPageTitle } from "@/components/admin/Title";
import { ToolSnapshot } from "@/lib/tools/interfaces";
import { fetchSS } from "@/lib/utilsSS";
import { Divider, Text, Title } from "@tremor/react";
import Link from "next/link";
import { FiPlusSquare, FiTool } from "react-icons/fi";
import { ToolsTable } from "./ToolsTable";

export default async function Page() {
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
    <div className="mx-auto container">
      <AdminPageTitle
        icon={<FiTool size={32} className="my-auto" />}
        title="Tools"
      />

      <Text className="mb-2">
        Tools allow assistants to retrieve information or take actions.
      </Text>

      <div>
        <Divider />

        <Title>Create a Tool</Title>
        <Link
          href="/admin/tools/new"
          className="
            flex
            py-2
            px-4
            mt-2
            border
            border-border
            h-fit
            cursor-pointer
            hover:bg-hover
            text-sm
            w-40
          "
        >
          <div className="mx-auto flex">
            <FiPlusSquare className="my-auto mr-2" />
            New Tool
          </div>
        </Link>

        <Divider />

        <Title>Existing Tools</Title>
        <ToolsTable tools={tools} />
      </div>
    </div>
  );
}
