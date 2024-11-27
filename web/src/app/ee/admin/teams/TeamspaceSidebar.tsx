import { ConnectorIndexingStatus, DocumentSet, Teamspace } from "@/lib/types";
import { TeamspaceSidebarContent } from "./TeamspaceSidebarContent";
import { Assistant } from "@/app/admin/assistants/interfaces";
import { useGradient } from "@/hooks/useGradient";
import { SidebarContent } from "@/components/ui/sidebar";

interface TeamspaceSidebarProps {
  selectedTeamspace?: Teamspace;
  assistants: Assistant[];
  ccPairs: ConnectorIndexingStatus<any, any>[];
  documentSets: DocumentSet[];
  refreshTeamspaces: () => void;
}

export const TeamspaceSidebar = ({
  selectedTeamspace,
  assistants,
  ccPairs,
  documentSets,
  refreshTeamspaces,
}: TeamspaceSidebarProps) => {
  return (
    <SidebarContent>
      {selectedTeamspace && (
        <TeamspaceSidebarContent
          teamspace={{
            ...selectedTeamspace,
            gradient: useGradient(selectedTeamspace.name),
          }}
          assistants={assistants}
          ccPairs={ccPairs}
          documentSets={documentSets}
          refreshTeamspaces={refreshTeamspaces}
        />
      )}
    </SidebarContent>
  );
};
