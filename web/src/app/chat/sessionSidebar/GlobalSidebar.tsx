import { UserSettingsButton } from "@/components/UserSettingsButton";
import { Ellipsis } from "lucide-react";
import Image from "next/image";

import ArnoldAi from "../../../../public/arnold_ai.png";
import { Separator } from "@/components/ui/separator";
import { User } from "@/lib/types";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Logo } from "@/components/Logo";
import { useContext } from "react";
import { SettingsContext } from "@/components/settings/SettingsProvider";
import Link from "next/link";
import { useTeamspaces } from "@/lib/hooks";

const generateGradient = (teamspaceName: string) => {
  const colors = ["#f9a8d4", "#8b5cf6", "#34d399", "#60a5fa", "#f472b6"];
  const index = teamspaceName.charCodeAt(0) % colors.length;
  return `linear-gradient(135deg, ${colors[index]}, ${
    colors[(index + 1) % colors.length]
  })`;
};

interface GlobalSidebarProps {
  openSidebar?: boolean;
  user?: User | null;
}

export const GlobalSidebar = ({ openSidebar, user }: GlobalSidebarProps) => {
  const { data } = useTeamspaces();

  const combinedSettings = useContext(SettingsContext);
  if (!combinedSettings) {
    return null;
  }
  const settings = combinedSettings.settings;
  const workspaces = combinedSettings.workspaces;
  const defaultPage = settings.default_page;

  return (
    <div className={`bg-background h-full p-4 border-r border-border z-10`}>
      <div
        className={`h-full flex flex-col justify-between transition-opacity duration-300 ease-in-out lg:!opacity-100  ${
          openSidebar ? "opacity-100 delay-200" : "opacity-0 delay-100"
        }`}
      >
        <div className="flex flex-col items-center">
          <Image
            src={ArnoldAi}
            alt="ArnoldAi Logo"
            width={40}
            height={40}
            className="rounded-regular shrink-0"
          />
          <Separator className="mt-6" />
          <div className="flex flex-col items-center gap-4 pt-4">
            <CustomTooltip
              trigger={
                <Link href={`/${defaultPage}`} className="flex items-center">
                  <Logo />
                </Link>
              }
              side="right"
              delayDuration={0}
            >
              {workspaces!.workspace_name
                ? workspaces!.workspace_name
                : "enMedD AI"}
            </CustomTooltip>
          </div>
          <Separator className="mt-6" />

          {data?.map((teamspace, i) => (
            <div key={i} className="flex flex-col items-center gap-4 pt-4">
              <CustomTooltip
                trigger={
                  <Link href={`/${defaultPage}`} className="flex items-center">
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
              >
                {teamspace.name}
              </CustomTooltip>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-4">
          <UserSettingsButton user={user} defaultPage={defaultPage} />
        </div>
      </div>
    </div>
  );
};
