import { Teamspace } from "@/lib/types";

interface TeamspaceAssistantProps {
  teamspace: Teamspace & { gradient: string };
}

export const TeamspaceAssistant = ({ teamspace }: TeamspaceAssistantProps) => {
  return (
    <div className="rounded-md bg-muted w-full p-4 min-h-32 flex flex-col justify-between">
      <h3 className="md:text-lg">
        Assistant <span className="px-2">|</span> {teamspace.cc_pairs.length}
      </h3>
      <div className="pt-4 flex flex-wrap -space-x-3">
        <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center font-semibold text-inverted text-lg">
          G
        </div>
        <div className="bg-success w-10 h-10 rounded-full flex items-center justify-center font-semibold text-inverted text-lg">
          J
        </div>
        <div className="bg-warning w-10 h-10 rounded-full flex items-center justify-center font-semibold text-inverted text-lg">
          I
        </div>
        <div className="bg-destructive w-10 h-10 rounded-full flex items-center justify-center font-semibold text-inverted text-lg">
          F
        </div>
        <div className="bg-background w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">
          +21
        </div>
      </div>
    </div>
  );
};
