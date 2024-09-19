import { CustomModal } from "@/components/CustomModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Teamspace } from "@/lib/types";
import { Bookmark, Copy, Plus } from "lucide-react";
import { TeamspaceMember } from "./TeamspaceMember";
import { TeamspaceAssistant } from "./TeamspaceAssistant";

interface TeamspaceSidebarContentProps {
  teamspace: Teamspace & { gradient: string };
}

export const TeamspaceSidebarContent = ({
  teamspace,
}: TeamspaceSidebarContentProps) => {
  return (
    <>
      <div style={{ background: teamspace.gradient }} className="h-40 relative">
        <div className="absolute top-full -translate-y-1/2 left-1/2 -translate-x-1/2">
          <span
            style={{ background: teamspace.gradient }}
            className="text-3xl uppercase font-bold min-w-16 min-h-16 flex items-center justify-center rounded-xl text-inverted border-[5px] border-inverted"
          >
            {teamspace.name.charAt(0)}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center px-6 py-14 w-full">
        <div className="flex flex-col items-center">
          <h1 className="text-center font-bold text-xl md:text-[28px]">
            {teamspace.name}
          </h1>
          <span className="text-center text-primary pt-3 font-medium">
            @MR.AI
          </span>
          <p className="text-center text-subtle pt-4 text-sm">
            Lorem ipsum dolor, sit amet consectetur adipisicing elit.
            Perferendis omnis nesciunt est saepe sequi nam cum ratione
            aspernatur reprehenderit, ducimus illo eveniet et quidem itaque
            ipsam error nobis, dolores accusamus!
          </p>
        </div>

        <div className="w-full flex flex-col gap-4 pt-14">
          <TeamspaceMember teamspace={teamspace} />
          <TeamspaceAssistant teamspace={teamspace} />
          <div className="rounded-md bg-muted w-full p-4 min-h-32 flex flex-col justify-between">
            <h3 className="md:text-lg">
              Document Set <span className="px-2">|</span> 3
            </h3>
            <div className="pt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">
                <Bookmark size={14} /> React
              </Badge>
              <Badge variant="secondary">
                <Bookmark size={14} /> Tailwind
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
