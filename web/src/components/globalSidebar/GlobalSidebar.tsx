"use client";

import { useContext } from "react";
import ArnoldAi from "../../../public/arnold_ai.png";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserSettingsButton } from "../UserSettingsButton";
import Image from "next/image";
import { CustomTooltip } from "../CustomTooltip";
import Link from "next/link";
import { Logo } from "../Logo";
import { SettingsContext } from "../settings/SettingsProvider";
import { useParams } from "next/navigation";
import { User } from "@/lib/types";
import { buildImgUrl } from "@/app/chat/files/images/utils";
import { Ellipsis } from "lucide-react";
import { TeamspaceModal } from "./TeamspaceModal";

export function GlobalSidebar({
  user,
  children,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: User | null;
  children?: React.ReactNode;
}) {
  const { teamspaceId } = useParams();
  const combinedSettings = useContext(SettingsContext);
  if (!combinedSettings) {
    return null;
  }
  const settings = combinedSettings.settings;
  const workspaces = combinedSettings.workspaces;
  const defaultPage = settings.default_page;

  let teamspaces = user?.groups || [];
  // if (teamspaceId) {
  //   const matchingTeamspace = teamspaces.find(
  //     (group) => group.id.toString() === teamspaceId
  //   );
  //   const otherTeamspaces = teamspaces.filter(
  //     (group) => group.id.toString() !== teamspaceId
  //   );
  //   teamspaces = matchingTeamspace
  //     ? [matchingTeamspace, ...otherTeamspaces]
  //     : otherTeamspaces;
  // }
  const displayedTeamspaces = teamspaces.slice(0, 8);
  const showEllipsis = user?.groups && user.groups.length > 8;

  const generateGradient = (teamspaceName: string) => {
    const colors = ["#CCCCCC", "#999999", "#666666", "#333333", "#000000"];
    const index = teamspaceName.charCodeAt(0) % colors.length;
    return `linear-gradient(135deg, ${colors[index]}, ${colors[(index + 1) % colors.length]})`;
  };

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
      {...props}
    >
      <Sidebar
        collapsible="none"
        className="!w-[calc(var(--sidebar-width-icon)_+_0px)] border-r"
      >
        <SidebarHeader className="p-0">
          <SidebarGroup>
            <SidebarMenu className="gap-2.5">
              <SidebarMenuItem className="border-b pb-2.5">
                <SidebarMenuButton
                  size="lg"
                  asChild
                  className="md:h-8 p-0 justify-center pointer-events-none"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Image
                      src={ArnoldAi}
                      alt="Arnold AI Logo"
                      width={32}
                      height={32}
                      className="rounded-regular shrink-0"
                    />
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className="border-b pb-2.5">
                <SidebarMenuButton size="lg" asChild className="w-8 h-8">
                  <CustomTooltip
                    trigger={
                      <Link
                        href={`/${defaultPage}`}
                        className="flex items-center justify-center"
                      >
                        {workspaces?.use_custom_logo ? (
                          <Logo width={32} height={32} />
                        ) : (
                          <Image
                            src={ArnoldAi}
                            alt="Arnold AI Logo"
                            width={32}
                            height={32}
                          />
                        )}
                      </Link>
                    }
                    side="right"
                    delayDuration={0}
                    asChild
                  >
                    {workspaces?.workspace_name
                      ? workspaces.workspace_name
                      : "Arnold AI"}
                  </CustomTooltip>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {displayedTeamspaces.map((teamspace) => (
                  <SidebarMenuItem
                    key={teamspace.id}
                    className="flex items-center justify-center"
                  >
                    <SidebarMenuButton
                      tooltip={{
                        children: teamspace.name,
                        hidden: false,
                      }}
                      className={`!p-0 w-8 h-8 ${Number(teamspaceId) === teamspace.id ? "bg-secondary-500 hover:bg-secondary-500" : ""}`}
                      isActive={teamspace.id.toString() === teamspaceId}
                    >
                      <Link
                        href={`/t/${teamspace.id}/${defaultPage}`}
                        className="w-full h-full flex items-center justify-center"
                      >
                        {teamspace.logo ? (
                          <img
                            src={buildImgUrl(teamspace.logo)}
                            alt="Teamspace Logo"
                            className={`object-cover shrink-0 ${Number(teamspaceId) === teamspace.id ? "h-[calc(100%_-_6px)] w-[calc(100%_-_6px)] rounded-xs" : "w-full h-full"}`}
                            width={28}
                            height={28}
                          />
                        ) : (
                          <div
                            style={{
                              background: generateGradient(teamspace.name),
                            }}
                            className={`font-bold text-inverted shrink-0  bg-brand-500 flex justify-center items-center uppercase ${Number(teamspaceId) === teamspace.id ? "h-[calc(100%_-_6px)] w-[calc(100%_-_6px)] rounded-xs" : "w-full h-full"}`}
                          >
                            {teamspace.name.charAt(0)}
                          </div>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                {!showEllipsis && (
                  <TeamspaceModal
                    teamspace={teamspaces}
                    defaultPage={defaultPage}
                    teamspaceId={teamspaceId}
                  />
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <UserSettingsButton defaultPage={defaultPage} />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}

      {children}
    </Sidebar>
  );
}
