"use client";

import {
  Search,
  MessageCircleMore,
  FolderPlus,
  Plus,
  Command,
} from "lucide-react";
import { useContext, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChatSession } from "../interfaces";

import { NEXT_PUBLIC_NEW_CHAT_DIRECTS_TO_SAME_ASSISTANT } from "@/lib/constants";

import { Folder } from "../folders/interfaces";
import { createFolder } from "../folders/FolderManagement";
import { SettingsContext } from "@/components/settings/SettingsProvider";

import EnmeddLogo from "../../../../public/logo-brand.png";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CustomTooltip } from "@/components/CustomTooltip";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Logo } from "@/components/Logo";
import ArnoldAi from "../../../../public/arnold_ai.png";
import { PageTab } from "@/components/PageTab";
import { buildImgUrl } from "../files/images/utils";
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

export const ChatSidebar = ({
  existingChats,
  currentChatSession,
  folders,
  openedFolders,
  isAssistant,
  teamspaceId,
  chatSessionIdRef,
}: {
  existingChats: ChatSession[];
  currentChatSession: ChatSession | null | undefined;
  folders: Folder[];
  openedFolders: { [key: number]: boolean };
  isAssistant?: boolean;
  teamspaceId?: string;
  chatSessionIdRef?: React.MutableRefObject<number | null>;
}) => {
  const router = useRouter();
  const { toast } = useToast();

  const currentChatId = currentChatSession?.id;

  // prevent the NextJS Router cache from causing the chat sidebar to not
  // update / show an outdated list of chats
  useEffect(() => {
    router.refresh();
  }, [currentChatId, router]);

  useKeyboardShortcuts([
    {
      key: "k",
      handler: () => {
        router.push(
          `${teamspaceId ? `/t/${teamspaceId}` : ""}/chat` +
            (NEXT_PUBLIC_NEW_CHAT_DIRECTS_TO_SAME_ASSISTANT &&
            currentChatSession
              ? `?assistantId=${currentChatSession.assistant_id}`
              : "")
        );
      },
      ctrlKey: true,
    },
    {
      key: "i",
      handler: () => {
        createFolder("New Folder")
          .then((folderId) => {
            console.log(`Folder created with ID: ${folderId}`);
            router.refresh();
          })
          .catch((error) => {
            console.error("Failed to create folder:", error);
            toast({
              title: "Folder Creation Failed",
              description: `Unable to create the folder: ${error.message}. Please try again.`,
              variant: "destructive",
            });
          });
      },
      ctrlKey: true,
    },
  ]);

  const combinedSettings = useContext(SettingsContext);
  if (!combinedSettings) {
    return null;
  }
  const settings = combinedSettings.settings;
  const workspaces = combinedSettings.workspaces;

  return (
    <Sidebar collapsible="none" className="flex-1 flex overflow-hidden">
      <SidebarHeader className="gap-0 pb-0 pt-[17px] md:pt-[9px] px-3 flex items-center justify-center">
        {workspaces && workspaces.custom_header_logo ? (
          <img
            src={buildImgUrl(workspaces?.custom_header_logo)}
            alt="Logo"
            className="h-9 object-contain w-full"
          />
        ) : (
          <Image src={ArnoldAi} alt="arnoldai-logo" height={40} />
        )}
        <Separator className="mt-[9px]" />
      </SidebarHeader>

      <SidebarContent className="gap-0 overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="whitespace-nowrap shrink-0 truncate"
                  asChild
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
                      variant="brand"
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
          existingChats={existingChats}
          currentChatId={currentChatId}
          folders={folders}
          openedFolders={openedFolders}
          teamspaceId={teamspaceId}
          chatSessionIdRef={chatSessionIdRef}
        />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="flex-row">
          <SidebarMenuItem className="flex-1">
            <SidebarMenuButton
              asChild
              variant="brand"
              className="flex items-center justify-center"
            >
              <Link
                href={
                  `${teamspaceId ? `/t/${teamspaceId}` : ""}/chat` +
                  (NEXT_PUBLIC_NEW_CHAT_DIRECTS_TO_SAME_ASSISTANT &&
                  currentChatSession
                    ? `?assistantId=${currentChatSession.assistant_id}`
                    : "")
                }
                className=" w-full"
              >
                <Plus size={16} />
                Start new chat
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* <SidebarMenuItem>
            <CustomTooltip
              asChild
              trigger={
                <SidebarMenuButton
                  variant="brand"
                  onClick={() =>
                    createFolder("New Folder", teamspaceId)
                      .then((folderId) => {
                        console.log(`Folder created with ID: ${folderId}`);
                        router.refresh();
                      })
                      .catch((error) => {
                        console.error("Failed to create folder:", error);
                        toast({
                          title: "Folder Creation Failed",
                          description: `Unable to create the folder: ${error.message}. Please try again.`,
                          variant: "destructive",
                        });
                      })
                  }
                >
                  <FolderPlus size={16} />
                </SidebarMenuButton>
              }
              side="right"
            >
              Create New Folder
            </CustomTooltip>
          </SidebarMenuItem> */}
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="brand"
              onClick={() =>
                createFolder("New Folder", teamspaceId)
                  .then((folderId) => {
                    console.log(`Folder created with ID: ${folderId}`);
                    router.refresh();
                  })
                  .catch((error) => {
                    console.error("Failed to create folder:", error);
                    toast({
                      title: "Folder Creation Failed",
                      description: `Unable to create the folder: ${error.message}. Please try again.`,
                      variant: "destructive",
                    });
                  })
              }
              tooltip={{
                children: "Create New Folder",
                hidden: false,
              }}
              size="icon"
              className="flex items-center justify-center"
            >
              <FolderPlus size={16} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
