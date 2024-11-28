"use client";

import { Assistant } from "@/app/admin/assistants/interfaces";
import { TeamspaceContent } from "./TeamspaceContent";
import { TeamspaceSidebar } from "./TeamspaceSidebar";
import { useState } from "react";
import {
  useConnectorCredentialIndexingStatus,
  useTeamspaces,
  useUsers,
} from "@/lib/hooks";
import { ThreeDotsLoader } from "@/components/Loading";
import { useDocumentSets } from "@/app/admin/documents/sets/hooks";
import { useParams } from "next/navigation";
import { useGradient } from "@/hooks/useGradient";

import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export const Main = ({ assistants }: { assistants: Assistant[] }) => {
  const { teamspaceId } = useParams();
  const [open, setOpen] = useState(false);
  const [selectedTeamspaceId, setSelectedTeamspaceId] = useState<number | null>(
    null
  );

  const { isLoading, error, data, refreshTeamspaces } = useTeamspaces();

  const {
    data: ccPairs,
    isLoading: isCCPairsLoading,
    error: ccPairsError,
  } = useConnectorCredentialIndexingStatus(undefined, false, teamspaceId);

  const {
    data: users,
    isLoading: userIsLoading,
    error: usersError,
  } = useUsers();

  const {
    data: documentSets,
    isLoading: isDocumentSetsLoading,
    error: documentSetsError,
  } = useDocumentSets();

  if (isLoading || isDocumentSetsLoading || userIsLoading || isCCPairsLoading) {
    return <ThreeDotsLoader />;
  }

  if (error || !data) {
    return <div className="text-red-600">Error loading teams</div>;
  }

  if (usersError || !users || documentSetsError) {
    return <div className="text-red-600">Error loading teams</div>;
  }

  if (ccPairsError || !ccPairs) {
    return <div className="text-red-600">Error loading connectors</div>;
  }

  const handleShowTeamspace = (teamspaceId: number) => {
    if (teamspaceId === selectedTeamspaceId && open) {
      setSelectedTeamspaceId(null);
      setOpen(false);
    } else {
      setSelectedTeamspaceId(teamspaceId);
      setOpen(true);
    }
  };

  const selectedTeamspace = data.find(
    (teamspace) => teamspace.id === selectedTeamspaceId
  );

  const teamspacesWithGradients = data.map((teamspace) => ({
    ...teamspace,
    gradient: useGradient(teamspace.name),
  }));

  return (
    <SidebarProvider
      open={open}
      onOpenChange={setOpen}
      style={
        {
          "--sidebar-width": "400px",
        } as React.CSSProperties
      }
      className="h-full w-full"
    >
      <SidebarInset className="w-full overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 absolute top-0 right-0">
          {open && (
            <SidebarTrigger className="-ml-1" onClick={() => setOpen(false)} />
          )}
        </header>
        <div className="h-full w-full overflow-y-auto">
          <div className="container">
            <TeamspaceContent
              assistants={assistants}
              onClick={handleShowTeamspace}
              data={teamspacesWithGradients}
              refreshTeamspaces={refreshTeamspaces}
              ccPairs={ccPairs}
              users={users}
              documentSets={documentSets}
            />
          </div>
        </div>
      </SidebarInset>

      <Sidebar
        className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
        side="right"
      >
        <TeamspaceSidebar
          assistants={assistants}
          selectedTeamspace={selectedTeamspace}
          ccPairs={ccPairs}
          documentSets={documentSets || []}
          refreshTeamspaces={refreshTeamspaces}
        />
      </Sidebar>
    </SidebarProvider>
  );
};
