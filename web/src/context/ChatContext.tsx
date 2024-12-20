"use client";

import React, { createContext, useContext, useState } from "react";
import { DocumentSet, Tag, User, ValidSources } from "@/lib/types";
import { ChatSession } from "@/app/chat/interfaces";
import { Assistant } from "@/app/admin/assistants/interfaces";
import { LLMProviderDescriptor } from "@/app/admin/configuration/llm/interfaces";
import { Folder } from "@/app/chat/folders/interfaces";
import { InputPrompt } from "@/app/admin/prompt-library/interfaces";

interface ChatContextProps {
  chatSessions: ChatSession[];
  availableSources: ValidSources[];
  availableDocumentSets: DocumentSet[];
  availableTags: Tag[];
  llmProviders: LLMProviderDescriptor[];
  folders: Folder[];
  openedFolders: Record<string, boolean>;
  userInputPrompts: InputPrompt[];
  shouldShowWelcomeModal?: boolean;
  shouldDisplaySourcesIncompleteModal?: boolean;
  defaultAssistantId?: number;
  refreshChatSessions: (teamspaceId?: string) => Promise<void>;
}

export const ChatContext = createContext<ChatContextProps | null>(null);

// We use Omit to exclude 'refreshChatSessions' from the value prop type
// because we're defining it within the component
export const ChatProvider: React.FC<{
  value: Omit<ChatContextProps, "refreshChatSessions">;
  children: React.ReactNode;
}> = ({ value, children }) => {
  const [chatSessions, setChatSessions] = useState(value?.chatSessions || []);

  const refreshChatSessions = async (teamspaceId?: string) => {
    try {
      const response = await fetch(
        teamspaceId
          ? `/api/chat/get-user-chat-sessions?teamspace_id=${teamspaceId}`
          : "/api/chat/get-user-chat-sessions"
      );
      if (!response.ok) throw new Error("Failed to fetch chat sessions");
      const { sessions } = await response.json();
      setChatSessions(sessions);
    } catch (error) {
      console.error("Error refreshing chat sessions:", error);
    }
  };

  return (
    <ChatContext.Provider
      value={{ ...value, chatSessions, refreshChatSessions }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = (): ChatContextProps => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
