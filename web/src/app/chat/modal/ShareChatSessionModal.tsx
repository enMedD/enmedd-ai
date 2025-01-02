import { useState } from "react";
import { ChatSessionSharedStatus } from "../interfaces";
import { CopyButton } from "@/components/CopyButton";
import { Copy, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CustomModal } from "@/components/CustomModal";
import { CustomTooltip } from "@/components/CustomTooltip";
import { useToast } from "@/hooks/use-toast";
import { SHARE_CHAT_SESSION_SUCCESS_MESSAGES } from "@/constants/success";
import { SHARE_CHAT_SESSION_ERROR_MESSAGES } from "@/constants/error";

function buildShareLink(chatSessionId: number) {
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  return `${baseUrl}/chat/shared/${chatSessionId}`;
}

async function generateShareLink(chatSessionId: number) {
  const response = await fetch(`/api/chat/chat-session/${chatSessionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sharing_status: "public" }),
  });

  if (response.ok) {
    return buildShareLink(chatSessionId);
  }
  return null;
}

async function deleteShareLink(chatSessionId: number) {
  const response = await fetch(`/api/chat/chat-session/${chatSessionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sharing_status: "private" }),
  });

  return response.ok;
}

export function ShareChatSessionModal({
  chatSessionId,
  existingSharedStatus,
  onShare,
  onPopover,
}: {
  chatSessionId: number;
  existingSharedStatus: ChatSessionSharedStatus;
  onShare?: (shared: boolean) => void;
  onPopover?: boolean;
}) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [linkGenerating, setLinkGenerating] = useState(false);
  const [shareLink, setShareLink] = useState<string>(
    existingSharedStatus === ChatSessionSharedStatus.Public
      ? buildShareLink(chatSessionId)
      : ""
  );
  const { toast } = useToast();

  return (
    <CustomModal
      title="Share link to Chat"
      trigger={
        onPopover ? (
          <div
            onClick={() => setIsShareModalOpen(true)}
            className="relative flex cursor-pointer select-none items-center gap-1.5 rounded-sm px-3 py-2.5 text-sm outline-none transition-colors hover:bg-brand-500 hover:text-inverted data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            <Share className="mr-2" size={16} />
            Share
          </div>
        ) : (
          <CustomTooltip
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7"
                onClick={() => setIsShareModalOpen(true)}
              >
                <Share size={20} />
              </Button>
            }
            asChild
          >
            Share
          </CustomTooltip>
        )
      }
      onClose={() => setIsShareModalOpen(false)}
      open={isShareModalOpen}
    >
      {shareLink ? (
        <div>
          <p>
            This chat session is currently shared. Anyone at your organization
            can view the message history using the following link:
          </p>

          <div className="flex py-2 items-center gap-2">
            <CopyButton content={shareLink} />
            <Link
              href={shareLink}
              target="_blank"
              className="underline text-link text-sm"
            >
              {shareLink}
            </Link>
          </div>

          <p className="mb-4">
            Click the button below to make the chat private again.
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsShareModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setLinkGenerating(true);

                const success = await deleteShareLink(chatSessionId);
                if (success) {
                  setShareLink("");
                  onShare && onShare(false);
                  toast({
                    title:
                      SHARE_CHAT_SESSION_SUCCESS_MESSAGES.DELETE_LINK.title,
                    description:
                      SHARE_CHAT_SESSION_SUCCESS_MESSAGES.DELETE_LINK
                        .description,
                    variant: "success",
                  });
                } else {
                  toast({
                    title: SHARE_CHAT_SESSION_ERROR_MESSAGES.DELETE_LINK.title,
                    description:
                      SHARE_CHAT_SESSION_ERROR_MESSAGES.DELETE_LINK.description,
                    variant: "destructive",
                  });
                }

                setLinkGenerating(false);
              }}
              variant="destructive"
            >
              Delete Share Link
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="pb-6">
            <span className="font-bold">Warning</span>
            <p className="pt-2">
              Ensure that all content in the chat is safe to share with the
              whole organization. The content of the retrieved documents will
              not be visible, but the names of cited documents as well as the AI
              and human messages will be visible.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setIsShareModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setLinkGenerating(true);

                // NOTE: for "inescure" non-https setup, the `navigator.clipboard.writeText` may fail
                // as the browser may not allow the clipboard to be accessed.
                try {
                  const shareLink = await generateShareLink(chatSessionId);
                  if (!shareLink) {
                    toast({
                      title:
                        SHARE_CHAT_SESSION_ERROR_MESSAGES.GENERATE_LINK.title,
                      description:
                        SHARE_CHAT_SESSION_ERROR_MESSAGES.GENERATE_LINK
                          .description,
                      variant: "destructive",
                    });
                  } else {
                    setShareLink(shareLink);
                    onShare && onShare(true);
                    navigator.clipboard.writeText(shareLink);
                    toast({
                      title:
                        SHARE_CHAT_SESSION_SUCCESS_MESSAGES.GENERATE_LINK.title,
                      description:
                        SHARE_CHAT_SESSION_SUCCESS_MESSAGES.GENERATE_LINK
                          .description,
                      variant: "success",
                    });
                  }
                } catch (e) {
                  console.error(e);
                  toast({
                    title: SHARE_CHAT_SESSION_ERROR_MESSAGES.UNEXPECTED.title,
                    description:
                      SHARE_CHAT_SESSION_ERROR_MESSAGES.UNEXPECTED.description,
                    variant: "destructive",
                  });
                }

                setLinkGenerating(false);
              }}
            >
              <Copy size={16} /> Generate and Copy Share Link
            </Button>
          </div>
        </div>
      )}
    </CustomModal>
  );
}
