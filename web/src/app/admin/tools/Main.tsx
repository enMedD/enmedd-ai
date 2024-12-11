"use client";

import { ToolsTable } from "@/app/admin/tools/ToolsTable";
import { ErrorCallout } from "@/components/ErrorCallout";
import { Button } from "@/components/ui/button";
import { SquarePlus } from "lucide-react";
import Link from "next/link";
import { Loading } from "@/components/Loading";
import { useTools } from "@/lib/hooks";

export const Main = ({ teamspaceId }: { teamspaceId?: string | string[] }) => {
  const { data, error, isLoading, refreshTools } = useTools();

  if (error) {
    return (
      <ErrorCallout
        errorTitle="Something went wrong :("
        errorMsg={`Failed to fetch tools - error`}
      />
    );
  }
  return (
    <div>
      <p>Tools allow assistants to retrieve information or take actions.</p>

      <div className="pt-10">
        <h3 className="pb-2">Create a Tool</h3>
        <Link
          href={
            teamspaceId
              ? `/t/${teamspaceId}/admin/tools/new`
              : "/admin/tools/new"
          }
        >
          <Button>
            <SquarePlus size={14} />
            New Tool
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="pt-10">
          <h3 className="pb-4">Existing Tools</h3>
          <ToolsTable
            tools={data || []}
            teamspaceId={teamspaceId}
            refreshTools={refreshTools}
          />
        </div>
      )}
    </div>
  );
};
