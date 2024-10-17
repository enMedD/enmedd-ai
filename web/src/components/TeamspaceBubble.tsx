import Link from "next/link";
import { CustomTooltip } from "./CustomTooltip";
import { MinimalTeamspaceSnapshot } from "@/lib/types";

interface TeamspaceBubbleProps {
  teamspace?: MinimalTeamspaceSnapshot | undefined;
  link: string;
}

export const TeamspaceBubble = ({ teamspace, link }: TeamspaceBubbleProps) => {
  if (!teamspace) return null;

  const generateGradient = (teamspaceName: string) => {
    const colors = ["#f9a8d4", "#8b5cf6", "#34d399", "#60a5fa", "#f472b6"];
    const index = teamspaceName.charCodeAt(0) % colors.length;
    return `linear-gradient(135deg, ${colors[index]}, ${
      colors[(index + 1) % colors.length]
    })`;
  };

  return (
    <CustomTooltip
      trigger={
        <Link href={`/${link}`} className="flex items-center">
          <div
            style={{ background: generateGradient(teamspace.name) }}
            className="font-bold text-inverted w-10 h-10 shrink-0 rounded-md bg-primary flex justify-center items-center uppercase"
          >
            {teamspace.name.charAt(0)}
          </div>
        </Link>
      }
      side="right"
      delayDuration={0}
      asChild
    >
      {teamspace.name}
    </CustomTooltip>
  );
};
