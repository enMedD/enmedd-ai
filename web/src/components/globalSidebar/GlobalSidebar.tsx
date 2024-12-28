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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
import { TeamspaceModal } from "./TeamspaceModal";
import { useGradient } from "@/hooks/useGradient";
import { useUserTeamspaces } from "@/lib/hooks";
import { Skeleton } from "../ui/skeleton";
import { HelperButton } from "../HelperButton";
import { Compass } from "lucide-react";

export function GlobalSidebar({
  user,
  children,
  isProfile,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: User | null;
  children?: React.ReactNode;
  isProfile?: boolean;
}) {
  const { teamspaceId } = useParams();
  const combinedSettings = useContext(SettingsContext);
  if (!combinedSettings) {
    return null;
  }
  const settings = combinedSettings.settings;
  const workspaces = combinedSettings.workspaces;
  const defaultPage = settings.default_page;

  const { data, isLoading } = useUserTeamspaces();
  const displayedTeamspaces = data?.slice(0, 8);
  const showEllipsis = user?.groups && user.groups.length > 8;

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
      {...props}
    >
      <Sidebar
        collapsible="none"
        className={`!w-[calc(var(--sidebar-width-icon)_-_1px)] ${isProfile ? "" : "border-r"}`}
      >
        <SidebarHeader className="p-0">
          <SidebarGroup>
            <SidebarMenu className="gap-2.5">
              <SidebarMenuItem className="border-b pb-2.5 flex justify-center">
                <SidebarMenuButton
                  size="lg"
                  asChild
                  className="!size-11 p-0 justify-center pointer-events-none"
                >
                  <div className="flex aspect-square !size-11 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Image
                      src={ArnoldAi}
                      alt="Arnold AI Logo"
                      width={44}
                      height={44}
                      className="rounded-regular shrink-0"
                    />
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className="border-b pb-2.5">
                <SidebarMenuButton size="lg" asChild className="w-11 h-11">
                  <CustomTooltip
                    trigger={
                      <Link
                        href={`/${defaultPage}`}
                        className="flex items-center justify-center"
                      >
                        <Logo width={44} height={44} />
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
                {isLoading
                  ? Array.from({ length: 8 }).map((_, index) => (
                      <SidebarMenuItem
                        key={`skeleton-${index}`}
                        className="flex items-center justify-center"
                      >
                        <Skeleton className="w-11 h-11 rounded-full" />
                      </SidebarMenuItem>
                    ))
                  : displayedTeamspaces?.map((teamspace) => (
                      <SidebarMenuItem
                        key={teamspace.id}
                        className="flex items-center justify-center"
                      >
                        <SidebarMenuButton
                          tooltip={{
                            children: teamspace.name,
                            hidden: false,
                          }}
                          className={`!p-0 w-11 h-11 rounded-full ${
                            Number(teamspaceId) === teamspace.id
                              ? "bg-secondary-500 hover:bg-secondary-500"
                              : ""
                          }`}
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
                                className={`object-cover shrink-0 ${
                                  Number(teamspaceId) === teamspace.id
                                    ? "h-[calc(100%_-_6px)] w-[calc(100%_-_6px)] rounded-full"
                                    : "w-full h-full"
                                }`}
                                width={40}
                                height={40}
                              />
                            ) : (
                              <div
                                style={{
                                  background: useGradient(teamspace.name),
                                }}
                                className={`font-bold text-inverted text-lg shrink-0 bg-brand-500 flex justify-center items-center uppercase ${
                                  Number(teamspaceId) === teamspace.id
                                    ? "h-[calc(100%_-_6px)] w-[calc(100%_-_6px)] rounded-full"
                                    : "w-full h-full"
                                }`}
                              >
                                {teamspace.name.charAt(0)}
                              </div>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}

                {showEllipsis && (
                  <TeamspaceModal
                    teamspace={data}
                    defaultPage={defaultPage}
                    teamspaceId={teamspaceId}
                  />
                )}

                <SidebarMenuItem className="flex items-center justify-center !mt-10">
                  <SidebarMenuButton
                    tooltip={{
                      children: "More",
                      hidden: false,
                    }}
                    className="!p-0 w-11 h-11 rounded-full flex items-center justify-center bg-brand-500 text-inverted hover:bg-brand-300 focus-visible:ring-brand-400"
                    asChild
                  >
                    <Link href={`/discovery/workspaces`}>
                      <Compass size={16} />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <HelperButton />
          <UserSettingsButton defaultPage={defaultPage} />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}

      {children}
    </Sidebar>
  );
}
