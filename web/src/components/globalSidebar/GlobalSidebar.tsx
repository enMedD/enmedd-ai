"use client";

import { UserSettingsButton } from "@/components/UserSettingsButton";
import ArnoldAi from "../../../public/arnold_ai.png";
import { Separator } from "@/components/ui/separator";
import { User } from "@/lib/types";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Logo } from "@/components/Logo";
import { useContext } from "react";
import { SettingsContext } from "@/components/settings/SettingsProvider";
import Link from "next/link";
import { TeamspaceBubble } from "@/components/TeamspaceBubble";
import Image from "next/image";
import { TeamspaceModal } from "./TeamspaceModal";
import { useParams } from "next/navigation";

interface GlobalSidebarProps {
  openSidebar?: boolean;
  user?: User | null;
}

export const GlobalSidebar = ({ openSidebar, user }: GlobalSidebarProps) => {
  const { teamspaceId } = useParams();
  const combinedSettings = useContext(SettingsContext);
  if (!combinedSettings) {
    return null;
  }
  const settings = combinedSettings.settings;
  const workspaces = combinedSettings.workspaces;
  const defaultPage = settings.default_page;

  const showEllipsis = user?.groups && user.groups.length > 8;

  return (
    <div className={`bg-background h-full p-4 border-r border-border z-10`}>
      <div
        className={`h-full flex flex-col justify-between transition-opacity duration-300 ease-in-out lg:!opacity-100  ${
          openSidebar ? "opacity-100 delay-200" : "opacity-0 delay-100"
        }`}
      >
        <div className="flex flex-col items-center h-full">
          <Image
            src={ArnoldAi}
            alt="ArnoldAi Logo"
            width={40}
            height={40}
            className="rounded-regular shrink-0"
          />
          <Separator className="mt-4" />
          <div className="flex flex-col items-center gap-4 pt-4">
            <CustomTooltip
              trigger={
                <Link
                  href={
                    teamspaceId
                      ? `/t/${teamspaceId}/${defaultPage}`
                      : `/${defaultPage}`
                  }
                  className="flex items-center"
                >
                  <Logo />
                </Link>
              }
              side="right"
              delayDuration={0}
              asChild
            >
              {workspaces?.workspace_name
                ? workspaces.workspace_name
                : "enMedD AI"}
            </CustomTooltip>
          </div>
          <Separator className="mt-4" />
          {user?.groups && (
            <div className="flex flex-col gap-3 pt-4">
              {user.groups?.map((teamspace) => (
                <TeamspaceBubble
                  key={teamspace.id}
                  teamspace={teamspace}
                  link={`t/${teamspace.id}/${defaultPage}`}
                />
              ))}
              {showEllipsis && <TeamspaceModal teamspace={user.groups} />}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-4">
          <UserSettingsButton user={user} defaultPage={defaultPage} />
        </div>
      </div>
    </div>
  );
};
