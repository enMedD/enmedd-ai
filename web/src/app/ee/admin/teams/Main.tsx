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
  useSidebar,
} from "@/components/ui/sidebar";
import { ConnectorIndexingStatus, DocumentSet, Teamspace } from "@/lib/types";
import { UsersResponse } from "@/lib/users/interfaces";

const Inset = ({
  open,
  assistants,
  data,
  refreshTeamspaces,
  ccPairs,
  users,
  documentSets,
  selectedTeamspaceId,
  openFalse,
  openTrue,
  setSelectedTeamspaceId,
  cancelEditName,
  cancelEditDescription,
}: {
  open: boolean;
  assistants: Assistant[];
  data: Teamspace[];
  refreshTeamspaces: () => void;
  ccPairs: ConnectorIndexingStatus<any, any>[];
  users: UsersResponse;
  documentSets: DocumentSet[] | undefined;
  selectedTeamspaceId: number | null;
  openFalse: () => void;
  openTrue: () => void;
  setSelectedTeamspaceId: (teamspaceId: number) => void;
  cancelEditName: () => void;
  cancelEditDescription: () => void;
}) => {
  const { toggleSidebar: toggleRightSidebar, isMobile } = useSidebar();

  const handleCloseSidebar = () => {
    openFalse();
  };

  const handleShowTeamspace = (teamspaceId: number) => {
    cancelEditName();
    cancelEditDescription();

    if (selectedTeamspaceId === teamspaceId) {
      if (open) {
        openFalse();
      } else {
        openTrue();
      }
    } else {
      setSelectedTeamspaceId(teamspaceId);
      if (!open) openTrue();
    }
    if (!teamspaceId || isMobile) {
      toggleRightSidebar();
    }
  };

  return (
    <SidebarInset className="w-full overflow-hidden">
      <header className="flex h-16 shrink-0 items-center gap-2 px-4 absolute top-0 right-0">
        {open && (
          <SidebarTrigger className="-ml-1" onClick={handleCloseSidebar} />
        )}
      </header>
      <div className="h-full w-full overflow-y-auto">
        <div className="container">
          <TeamspaceContent
            assistants={assistants}
            onClick={handleShowTeamspace}
            data={data}
            refreshTeamspaces={refreshTeamspaces}
            ccPairs={ccPairs}
            users={users}
            documentSets={documentSets}
          />
        </div>
      </div>
    </SidebarInset>
  );
};

export const Main = ({ assistants }: { assistants: Assistant[] }) => {
  const { teamspaceId } = useParams();
  const [open, setOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
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
      <Inset
        open={open}
        assistants={assistants}
        data={teamspacesWithGradients}
        refreshTeamspaces={refreshTeamspaces}
        ccPairs={ccPairs}
        users={users}
        documentSets={documentSets}
        selectedTeamspaceId={selectedTeamspaceId}
        openFalse={() => setOpen(false)}
        openTrue={() => setOpen(true)}
        setSelectedTeamspaceId={setSelectedTeamspaceId}
        cancelEditName={() => setIsEditingName(false)}
        cancelEditDescription={() => setIsEditingDescription(false)}
      />

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
          isEditingName={isEditingName}
          isEditingDescription={isEditingDescription}
          // editName={() => setIsEditingName(true)}
          // editDescription={() => setIsEditingDescription(true)}
          // cancelEditName={() => setIsEditingName(false)}
          // cancelEditDescription={() => setIsEditingDescription(false)}
          setIsEditingName={setIsEditingName}
          setIsEditingDescription={setIsEditingDescription}
        />
      </Sidebar>
    </SidebarProvider>
  );
};
