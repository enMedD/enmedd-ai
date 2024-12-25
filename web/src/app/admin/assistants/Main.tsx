"use client";

import { AdminPageTitle } from "@/components/admin/Title";
import { ErrorCallout } from "@/components/ErrorCallout";
import { RobotIcon } from "@/components/icons/icons";
import { Button } from "@/components/ui/button";
import { SquarePlus } from "lucide-react";
import Link from "next/link";
import { AssistantsTable } from "./AssistantTable";
import { Loading } from "@/components/Loading";
import { useAdminAssistants } from "@/lib/hooks";

export default function Main({
  teamspaceId,
}: {
  teamspaceId?: string | string[];
}) {
  const {
    data: allAssistants,
    error: allAssistantsError,
    isLoading: loadingAllAssistant,
    refreshAdminAssistants,
  } = useAdminAssistants(false, teamspaceId);

  const {
    data: editableAssistants,
    error: editableAssistantsError,
    isLoading: loadingEditableAssistants,
    refreshAdminAssistants: refreshEditableAssistants,
  } = useAdminAssistants(true, teamspaceId);

  const error = allAssistantsError || editableAssistantsError;
  const isLoading = loadingAllAssistant || loadingEditableAssistants;

  const refreshAllAssistants = () => {
    refreshAdminAssistants();
    refreshEditableAssistants();
  };

  return (
    <div
      className={`w-full h-full ${isLoading ? "overflow-y-hidden" : "overflow-y-auto"}`}
    >
      <div className="container mx-auto">
        {error ? (
          <ErrorCallout
            errorTitle="Something went wrong :("
            errorMsg={`Failed to fetch assistants - ${error}`}
          />
        ) : (
          <>
            <AdminPageTitle icon={<RobotIcon size={32} />} title="Assistants" />
            {isLoading ? (
              <Loading />
            ) : (
              <>
                <p className="mb-2">
                  Assistants are a way to build custom search/question-answering
                  experiences for different use cases.
                </p>
                <h3 className="mt-2">They allow you to customize:</h3>
                <ul className="mt-2 ml-4 text-sm list-disc">
                  <li>
                    The prompt used by your LLM of choice to respond to the user
                    query
                  </li>
                  <li>The documents that are used as context</li>
                </ul>

                <h3 className="pt-4">Create an Assistant</h3>
                <Link
                  href={
                    teamspaceId
                      ? `/t/${teamspaceId}/admin/assistants/new`
                      : "/admin/assistants/new"
                  }
                  className="flex items-center"
                >
                  <Button
                    className="mt-2"
                    onClick={() => localStorage.removeItem("assistantFormData")}
                  >
                    <SquarePlus size={16} />
                    New Assistant
                  </Button>
                </Link>

                <h3 className="pt-6">Existing Assistants</h3>
                <p className="pb-4 text-sm">
                  Assistants will be displayed as options on the Chat / Search
                  interfaces in the order they are displayed below. Assistants
                  marked as hidden will not be displayed.
                </p>
                <AssistantsTable
                  allAssistants={allAssistants || []}
                  editableAssistants={editableAssistants || []}
                  teamspaceId={teamspaceId}
                  refreshAllAssistants={refreshAllAssistants}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
