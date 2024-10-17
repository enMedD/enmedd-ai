"use client";

import SidebarWrapper from "../SidebarWrapper";
import { ChatSession } from "@/app/chat/interfaces";
import { Folder } from "@/app/chat/folders/interfaces";
import { Assistant } from "@/app/admin/assistants/interfaces";
import { User } from "@/lib/types";
import { AssistantsGallery } from "./AssistantsGallery";
import { AssistantsBars } from "../mine/AssistantsBars";
import { ChatSidebar } from "@/app/chat/sessionSidebar/ChatSidebar";

export default function WrappedAssistantsGallery({
  chatSessions,
  initiallyToggled,
  folders,
  openedFolders,
  user,
  assistants,
}: {
  chatSessions: ChatSession[];
  folders: Folder[];
  initiallyToggled: boolean;
  openedFolders: { [key: number]: boolean };
  user: User | null;
  assistants: Assistant[];
}) {
  return (
    <div className="relative flex h-screen overflow-x-hidden bg-background">
      <AssistantsBars user={user}>
        <ChatSidebar
          existingChats={chatSessions}
          currentChatSession={null}
          folders={folders}
          openedFolders={openedFolders}
          isAssistant
        />
      </AssistantsBars>

      <div
        className={`w-full h-full flex flex-col overflow-y-auto overflow-x-hidden relative pt-24 px-4 2xl:pt-10`}
      >
        <AssistantsGallery assistants={assistants} user={user} />
      </div>
    </div>
  );
}
