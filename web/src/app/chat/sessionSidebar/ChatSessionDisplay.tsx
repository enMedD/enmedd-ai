"use client";

import { useRouter } from "next/navigation";
import { ChatSession } from "../interfaces";
import { useState, useEffect, useContext } from "react";
import {
  deleteChatSession,
  getChatRetentionInfo,
  renameChatSession,
} from "../lib";
import { BasicSelectable } from "@/components/BasicClickable";
import Link from "next/link";

import { ShareChatSessionModal } from "../modal/ShareChatSessionModal";
import { CHAT_SESSION_ID_KEY, FOLDER_ID_KEY } from "@/lib/drag/constants";
import {
  Ellipsis,
  X,
  Check,
  Pencil,
  MessageCircleMore,
  Trash,
} from "lucide-react";
import { CustomTooltip } from "@/components/CustomTooltip";
import { SettingsContext } from "@/components/settings/SettingsProvider";
import { WarningCircle } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { useChatContext } from "@/context/ChatContext";
import { DeleteModal } from "@/components/DeleteModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FeatureFlagWrapper } from "@/components/feature_flag/FeatureFlagWrapper";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import { CHAT_SESSION_SUCCESS_MESSAGES } from "@/constants/toast/success";
import { CHAT_SESSION_ERROR_MESSAGES } from "@/constants/toast/error";

export function ChatSessionDisplay({
  chatSession,
  search,
  isSelected,
  skipGradient,
  toggleSideBar,
  teamspaceId,
  chatSessionIdRef,
}: {
  chatSession: ChatSession;
  isSelected: boolean;
  search?: boolean;
  // needed when the parent is trying to apply some background effect
  // if not set, the gradient will still be applied and cause weirdness
  skipGradient?: boolean;
  toggleSideBar?: () => void;
  teamspaceId?: string;
  chatSessionIdRef?: React.MutableRefObject<number | null>;
}) {
  const router = useRouter();
  const [isRenamingChat, setIsRenamingChat] = useState(false);
  const [chatName, setChatName] = useState(chatSession.name);
  const [delayedSkipGradient, setDelayedSkipGradient] = useState(skipGradient);
  const settings = useContext(SettingsContext);
  const { toast } = useToast();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  let { refreshChatSessions } = useChatContext();
  const [deletingChatSession, setDeletingChatSession] =
    useState<ChatSession | null>();

  const showDeleteModal = (chatSession: ChatSession) => {
    setDeletingChatSession(chatSession);
  };

  useEffect(() => {
    if (skipGradient) {
      setDelayedSkipGradient(true);
    } else {
      const timer = setTimeout(() => {
        setDelayedSkipGradient(skipGradient);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [skipGradient]);

  const onRename = async () => {
    const response = await renameChatSession(chatSession.id, chatName);
    if (response.ok) {
      setIsRenamingChat(false);
      router.refresh();
      toast({
        title: CHAT_SESSION_SUCCESS_MESSAGES.RENAME.title,
        description: CHAT_SESSION_SUCCESS_MESSAGES.RENAME.description,
        variant: "success",
      });
    } else {
      toast({
        title: CHAT_SESSION_ERROR_MESSAGES.RENAME.title,
        description: CHAT_SESSION_ERROR_MESSAGES.RENAME.description,
        variant: "destructive",
      });
    }
  };

  if (!settings) {
    return <></>;
  }

  const { daysUntilExpiration, showRetentionWarning } = getChatRetentionInfo(
    chatSession,
    settings?.settings
  );

  return (
    <CustomTooltip
      trigger={
        <SidebarMenuItem>
          <Link
            className="flex relative w-full"
            key={chatSession.id}
            href={
              teamspaceId
                ? `/t/${teamspaceId}/chat?chatId=${chatSession.id}`
                : `/chat?chatId=${chatSession.id}`
            }
            scroll={false}
            draggable="true"
            onDragStart={(event) => {
              event.dataTransfer.setData(
                CHAT_SESSION_ID_KEY,
                chatSession.id.toString()
              );
              event.dataTransfer.setData(
                FOLDER_ID_KEY,
                chatSession.folder_id?.toString() || ""
              );
            }}
            onClick={toggleSideBar}
          >
            <BasicSelectable fullWidth selected={isSelected}>
              <>
                <div className="flex relative items-center gap-2 w-full">
                  <MessageCircleMore size={16} className="shrink-0" />
                  {isRenamingChat ? (
                    <input
                      value={chatName}
                      onChange={(e) => setChatName(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          onRename();
                          event.preventDefault();
                        }
                      }}
                      className="-my-px px-1 py-[1px] mr-2 w-full rounded"
                      placeholder="Enter chat name"
                    />
                  ) : (
                    <p className="mr-3 break-all truncate">
                      {chatName || `Chat ${chatSession.id}`}
                    </p>
                  )}
                  {isSelected &&
                    (isRenamingChat ? (
                      <div className="ml-auto my-auto flex">
                        <div
                          onClick={onRename}
                          className={`hover:bg-background-inverted/10 p-1 -m-1 rounded`}
                        >
                          <Check size={16} />
                        </div>
                        <div
                          onClick={() => {
                            setChatName(chatSession.name);
                            setIsRenamingChat(false);
                          }}
                          className={`hover:bg-background-inverted/10 p-1 -m-1 rounded ml-2`}
                        >
                          <X size={16} />
                        </div>
                      </div>
                    ) : (
                      <div className="ml-auto my-auto flex z-30 gap-1">
                        <div className="flex items-center">
                          {showRetentionWarning && (
                            <CustomTooltip
                              trigger={
                                <div className="hover:bg-background-inverted/10 p-1 rounded flex items-center justify-center shrink-0 mr-1">
                                  <WarningCircle
                                    className="text-warning"
                                    size={16}
                                  />
                                </div>
                              }
                              asChild
                            >
                              <p>
                                This chat will expire{" "}
                                {daysUntilExpiration < 1
                                  ? "today"
                                  : `in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? "s" : ""}`}
                              </p>
                            </CustomTooltip>
                          )}
                          <div className={"-m-1"}>
                            <DropdownMenu
                              onOpenChange={(open) => setIsPopoverOpen(open)}
                            >
                              <DropdownMenuTrigger
                                className="focus:outline-none"
                                asChild
                              >
                                <div className="hover:bg-background-inverted/10 p-1 rounded flex items-center justify-center">
                                  <Ellipsis size={16} />
                                </div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuGroup>
                                  <FeatureFlagWrapper flag="share_chat">
                                    <DropdownMenuItem asChild>
                                      <ShareChatSessionModal
                                        chatSessionId={chatSession.id}
                                        existingSharedStatus={
                                          chatSession.shared_status
                                        }
                                        onPopover
                                      />
                                    </DropdownMenuItem>
                                  </FeatureFlagWrapper>

                                  <DropdownMenuItem
                                    asChild
                                    onClick={() => setIsRenamingChat(true)}
                                  >
                                    <div>
                                      <Pencil className="mr-2" size={16} />
                                      <span>Rename</span>
                                    </div>
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div
                          className="hover:bg-background-inverted/10 p-1 rounded"
                          onClick={() => showDeleteModal(chatSession)}
                        >
                          <Trash size={16} />
                        </div>

                        {deletingChatSession && (
                          <DeleteModal
                            title="Delete chat?"
                            description={
                              <>
                                Click below to confirm that you want to delete{" "}
                                <b>
                                  &quot;{chatSession.name.slice(0, 30)}&quot;
                                </b>
                              </>
                            }
                            onClose={() => setDeletingChatSession(null)}
                            open={!!deletingChatSession}
                            onSuccess={async () => {
                              const response = await deleteChatSession(
                                deletingChatSession.id
                              );
                              if (response.ok) {
                                setDeletingChatSession(null);
                                // go back to the main page
                                if (
                                  deletingChatSession.id ===
                                  chatSessionIdRef?.current
                                ) {
                                  router.push(
                                    teamspaceId
                                      ? `/t/${teamspaceId}/chat`
                                      : "/chat"
                                  );
                                }

                                toast({
                                  title:
                                    CHAT_SESSION_SUCCESS_MESSAGES.DELETE.title,
                                  description:
                                    CHAT_SESSION_SUCCESS_MESSAGES.DELETE
                                      .description,
                                  variant: "success",
                                });
                              } else {
                                toast({
                                  title:
                                    CHAT_SESSION_ERROR_MESSAGES.DELETE.title,
                                  description:
                                    CHAT_SESSION_ERROR_MESSAGES.DELETE
                                      .description,
                                  variant: "destructive",
                                });
                              }
                              refreshChatSessions(teamspaceId);
                            }}
                          />
                        )}
                      </div>
                    ))}
                </div>
                {isSelected && !isRenamingChat && !delayedSkipGradient && (
                  <div className="absolute bottom-0 right-0 top-0 bg-gradient-to-l to-transparent from-hover w-20 from-60% rounded" />
                )}
              </>
            </BasicSelectable>
          </Link>
        </SidebarMenuItem>
      }
      side="right"
      asChild
      open={isPopoverOpen ? false : undefined}
    >
      {chatName || `Chat ${chatSession.id}`}
    </CustomTooltip>
  );
}
