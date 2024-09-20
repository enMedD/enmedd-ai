import { Badge } from "@/components/ui/badge";
import { Teamspace } from "@/lib/types";
import { BookmarkIcon } from "lucide-react";

interface TeamspaceAssistantProps {
  teamspace: Teamspace & { gradient: string };
}

export const TeamspaceAssistant = ({ teamspace }: TeamspaceAssistantProps) => {
  return (
    <div className="rounded-md bg-muted w-full p-4 min-h-32 flex flex-col justify-between">
      <h3 className="md:text-lg">
        Assistant <span className="px-2">|</span> {teamspace.assistants.length}
      </h3>
      {teamspace.assistants.length > 0 ? (
        <div className="pt-4 flex flex-wrap gap-2">
          {teamspace.assistants.map((assistant) => {
            return <Badge key={assistant.id}>{assistant.name}</Badge>;
          })}
        </div>
      ) : (
        <p>There are no asssitant.</p>
      )}
    </div>
  );
};
