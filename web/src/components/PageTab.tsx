import { CHAT_SESSION_ID_KEY, FOLDER_ID_KEY } from "@/lib/drag/constants";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useChatContext } from "@/context/ChatContext";
import { ChatSession } from "@/app/chat/interfaces";
import { Folder } from "@/app/chat/folders/interfaces";
import { groupSessionsByDateRange } from "@/app/chat/lib";
import { removeChatFromFolder } from "@/app/chat/folders/FolderManagement";
import { FolderList } from "@/app/chat/folders/FolderList";
import { ChatSessionDisplay } from "@/app/chat/sessionSidebar/ChatSessionDisplay";
import { SearchSessionDisplay } from "@/app/chat/sessionSidebar/SearchSessionDisplay";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "./ui/sidebar";
import { FOLDER_SUCCESS_MESSAGES } from "@/constants/success";
import { FOLDER_ERROR_MESSAGES } from "@/constants/error";

export function PageTab({
  existingChats,
  currentChatId,
  folders,
  openedFolders,
  toggleSideBar,
  teamspaceId,
  chatSessionIdRef,
  isSearch,
}: {
  existingChats: ChatSession[];
  currentChatId?: number;
  folders?: Folder[];
  openedFolders?: { [key: number]: boolean };
  toggleSideBar?: () => void;
  teamspaceId?: string;
  chatSessionIdRef?: React.MutableRefObject<number | null>;
  isSearch?: boolean;
}) {
  const groupedChatSessions = groupSessionsByDateRange(existingChats);
  const router = useRouter();
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const { toast } = useToast();

  const chatContext = !isSearch ? useChatContext() : null;
  const refreshChatSessions = chatContext
    ? chatContext.refreshChatSessions
    : undefined;

  const handleDropToRemoveFromFolder = async (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDragOver(false);

    const chatSessionId = event.dataTransfer.getData(CHAT_SESSION_ID_KEY);
    const folderId = event.dataTransfer.getData(FOLDER_ID_KEY);

    if (folderId && refreshChatSessions) {
      try {
        await removeChatFromFolder(parseInt(folderId, 10), chatSessionId);
        toast({
          title: FOLDER_SUCCESS_MESSAGES.REMOVE.title,
          description: FOLDER_SUCCESS_MESSAGES.REMOVE.description,
          variant: "success",
        });
        refreshChatSessions(teamspaceId);
        router.refresh();
      } catch (error) {
        toast({
          title: FOLDER_ERROR_MESSAGES.REMOVE.title,
          description: FOLDER_ERROR_MESSAGES.REMOVE.description,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <>
      {isSearch ? (
        <SidebarGroup>
          {Object.entries(groupedChatSessions).map(
            ([dateRange, chatSessions]) => {
              if (chatSessions.length > 0) {
                return (
                  <React.Fragment key={dateRange}>
                    <SidebarGroupLabel>{dateRange}</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {chatSessions
                          .filter((chat) => chat.folder_id === null)
                          .map((chat) => {
                            const isSelected = currentChatId === chat.id;
                            return (
                              <SearchSessionDisplay
                                chatSession={chat}
                                isSelected={isSelected}
                                toggleSideBar={toggleSideBar}
                                teamspaceId={teamspaceId}
                                key={`${chat.id}-${chat.name}`}
                              />
                            );
                          })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                    <Separator className="mt-2" />
                  </React.Fragment>
                );
              }
            }
          )}
        </SidebarGroup>
      ) : (
        <>
          {folders && folders.length > 0 && (
            <SidebarGroup className="pt-0">
              <SidebarGroupLabel>Folders</SidebarGroupLabel>
              <FolderList
                folders={folders}
                currentChatId={currentChatId}
                openedFolders={openedFolders}
                chatSessionIdRef={chatSessionIdRef}
                teamspaceId={teamspaceId}
              />
              {folders.length == 1 && folders[0].chat_sessions.length == 0 && (
                <SidebarGroupLabel className="text-subtle">
                  Drag a chat into a folder to save for later
                </SidebarGroupLabel>
              )}
              <Separator className="mt-2" />
            </SidebarGroup>
          )}

          <SidebarGroup
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDropToRemoveFromFolder}
            className={`transition duration-300 ease-in-out w-[calc(100%_-_16px)] mx-auto p-0 ${
              isDragOver ? "bg-hover" : ""
            } rounded-xs`}
          >
            {Object.entries(groupedChatSessions).map(
              ([dateRange, chatSessions]) => {
                if (chatSessions.length > 0) {
                  return (
                    <React.Fragment key={dateRange}>
                      <SidebarGroupLabel>{dateRange}</SidebarGroupLabel>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {chatSessions
                            .filter((chat) => chat.folder_id === null)
                            .map((chat) => {
                              const isSelected = currentChatId === chat.id;
                              return (
                                <ChatSessionDisplay
                                  chatSession={chat}
                                  isSelected={isSelected}
                                  skipGradient={isDragOver}
                                  toggleSideBar={toggleSideBar}
                                  teamspaceId={teamspaceId}
                                  chatSessionIdRef={chatSessionIdRef}
                                  key={`${chat.id}-${chat.name}`}
                                />
                              );
                            })}
                        </SidebarMenu>
                      </SidebarGroupContent>
                      <Separator className="my-2" />
                    </React.Fragment>
                  );
                }
              }
            )}
          </SidebarGroup>
        </>
      )}
    </>
  );
}
