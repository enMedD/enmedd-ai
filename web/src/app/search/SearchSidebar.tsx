"use client";

import React from "react";
import { useContext } from "react";
import Image from "next/image";

import { SettingsContext } from "@/components/settings/SettingsProvider";
import { useSearchContext } from "@/context/SearchContext";
import { ChatSession } from "../chat/interfaces";
import { Logo } from "@/components/Logo";
import ArnoldAi from "../../../public/arnold_ai.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Command, MessageCircleMore, Search } from "lucide-react";
import { PageTab } from "@/components/PageTab";
import { buildImgUrl } from "../chat/files/images/utils";
import { Separator } from "@/components/ui/separator";

export const SearchSidebar = ({
  currentSearchSession,
  openSidebar,
  teamspaceId,
  toggleSideBar,
}: {
  currentSearchSession?: ChatSession | null | undefined;
  openSidebar?: boolean;
  teamspaceId?: string;
  toggleSideBar?: () => void;
}) => {
  const { querySessions } = useSearchContext();
  const combinedSettings = useContext(SettingsContext);
  if (!combinedSettings) {
    return null;
  }
  const settings = combinedSettings.settings;
  const workspaces = combinedSettings.workspaces;

  const currentSearchId = currentSearchSession?.id;

  return (
    <Sidebar collapsible="none" className="flex-1 flex overflow-hidden">
      <SidebarHeader className="gap-0 pb-0 pt-[17px] md:pt-[9px] flex items-center justify-center">
        {workspaces && workspaces.custom_header_logo ? (
          <img
            src={buildImgUrl(workspaces?.custom_header_logo)}
            alt="Logo"
            className="h-8 object-contain w-full"
          />
        ) : (
          <Image src={ArnoldAi} alt="arnoldai-logo" height={32} />
        )}
        <Separator className="mt-[9px]" />
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="whitespace-nowrap shrink-0 truncate bg-brand-500 text-inverted hover:bg-brand-500"
                >
                  <Link
                    href={teamspaceId ? `/t/${teamspaceId}/search` : "/search"}
                    className={`flex items-center gap-2 justify-between w-full`}
                  >
                    <div className="flex items-center gap-2">
                      <Search size={16} className="shrink-0" />
                      Search
                    </div>
                    <div className="flex items-center gap-1 font-normal">
                      <Command size={14} />S
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {settings.chat_page_enabled && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="whitespace-nowrap shrink-0 truncate"
                      asChild
                    >
                      <Link
                        href={teamspaceId ? `/t/${teamspaceId}/chat` : "/chat"}
                        className={`flex items-center gap-2 justify-between w-full`}
                      >
                        <div className="flex items-center gap-2">
                          <MessageCircleMore size={16} className="shrink-0" />
                          Chat
                        </div>

                        <div className="flex items-center gap-1 font-normal">
                          <Command size={14} />D
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* {combinedSettings.featureFlags.explore_assistants && (
                    <SidebarMenuItem>
                      <SidebarMenuButton className="whitespace-nowrap shrink-0 truncate">
                        <Link
                          href="/assistants/mine"
                          className={`flex items-center gap-2 justify-between w-full`}
                        >
                          <div className="flex items-center gap-2">
                            <Headset size={16} />
                            Explore Assistants
                          </div>

                          <div className="flex items-center gap-1 font-normal">
                            <Command size={14} />A
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )} */}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
          <Separator className="mt-2" />
        </SidebarGroup>

        <PageTab
          existingChats={querySessions}
          currentChatId={currentSearchId}
          toggleSideBar={toggleSideBar}
          teamspaceId={teamspaceId}
          isSearch
        />
      </SidebarContent>
    </Sidebar>
  );
};
