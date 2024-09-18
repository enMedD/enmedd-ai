import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Teamspace } from "@/lib/types";
import { Cpu, Users } from "lucide-react";

interface TeamspacesCardProps {
  teamspaces: Teamspace[];
  refresh: () => void;
}

export const TeamspacesCard = ({
  teamspaces,
  refresh,
}: TeamspacesCardProps) => {
  return (
    <div className="grid grid-cols-3 gap-16 px-10">
      {teamspaces
        .filter((teamspace) => !teamspace.is_up_for_deletion)
        .map((teamspace) => {
          return (
            <Card
              key={teamspace.id}
              className="overflow-hidden !rounded-xl cursor-pointer"
            >
              <CardHeader className="bg-red-500 p-10"></CardHeader>
              <CardContent className="flex flex-col justify-between min-h-52 relative bg-muted/50">
                <div className="absolute top-0 -translate-y-1/2 right-4">
                  <span className="text-3xl uppercase font-bold min-w-16 min-h-16 bg-primary flex items-center justify-center rounded-xl text-inverted border-[5px] border-inverted">
                    {teamspace.name.charAt(0)}
                  </span>
                </div>

                <div>
                  <h2 className="font-bold md:text-xl">{teamspace.name}</h2>
                  <span>@mrquilbot</span>
                </div>

                <div className="w-full flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users size={20} />
                    {teamspace.users.length} People
                  </span>

                  <span className="flex items-center gap-2">
                    <Cpu size={20} />
                    {teamspace.cc_pairs.length} Assistant
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
};
