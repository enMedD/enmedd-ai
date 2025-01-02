import { Lightbulb } from "@phosphor-icons/react/dist/ssr";
import { PopupSpec } from "../admin/connectors/Popup";
import {
  BookmarkIcon,
  ChevronsDownIcon,
  ChevronsUpIcon,
  LightBulbIcon,
  LightSettingsIcon,
} from "../icons/icons";
import { useToast } from "@/hooks/use-toast";
import { CustomTooltip } from "../CustomTooltip";
import { CHAT_PAGE_SUCCESS_MESSAGES } from "@/constants/success";
import { CHAT_PAGE_ERROR_MESSAGES } from "@/constants/error";

type DocumentFeedbackType = "endorse" | "reject" | "hide" | "unhide";

const giveDocumentFeedback = async (
  documentId: string,
  messageId: number,
  documentRank: number,
  searchFeedback: DocumentFeedbackType
): Promise<string | null> => {
  const response = await fetch("/api/chat/document-search-feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message_id: messageId,
      document_id: documentId,
      document_rank: documentRank,
      click: false,
      search_feedback: searchFeedback,
    }),
  });
  return response.ok
    ? null
    : response.statusText || (await response.json()).message;
};

interface DocumentFeedbackIconProps {
  documentId: string;
  messageId: number;
  documentRank: number;
  feedbackType: DocumentFeedbackType;
}

const DocumentFeedback = ({
  documentId,
  messageId,
  documentRank,
  feedbackType,
}: DocumentFeedbackIconProps) => {
  const { toast } = useToast();
  let icon = null;
  const size = 20;
  if (feedbackType === "endorse") {
    icon = (
      <ChevronsUpIcon
        size={size}
        className="my-auto flex flex-shrink-0 text-brand-500"
      />
    );
  }
  if (feedbackType === "reject") {
    icon = (
      <ChevronsDownIcon
        size={size}
        className="my-auto flex flex-shrink-0 text-destructive-500"
      />
    );
  }
  if (!icon) {
    // TODO: support other types of feedback
    return null;
  }

  return (
    <div
      onClick={async () => {
        const errorMsg = await giveDocumentFeedback(
          documentId,
          messageId,
          documentRank,
          feedbackType
        );
        if (!errorMsg) {
          toast({
            title: CHAT_PAGE_SUCCESS_MESSAGES.FEEDBACK.title,
            description: CHAT_PAGE_SUCCESS_MESSAGES.FEEDBACK.description,
            variant: "success",
          });
        } else {
          toast({
            title: CHAT_PAGE_ERROR_MESSAGES.FEEDBACK.title,
            description:
              CHAT_PAGE_ERROR_MESSAGES.FEEDBACK.description(errorMsg),
            variant: "destructive",
          });
        }
      }}
      className="cursor-pointer"
    >
      {icon}
    </div>
  );
};

interface DocumentFeedbackBlockProps {
  documentId: string;
  messageId: number;
  documentRank: number;
}

export const DocumentFeedbackBlock = ({
  documentId,
  messageId,
  documentRank,
}: DocumentFeedbackBlockProps) => {
  return (
    <div className="flex items-center gap-x-2">
      <CustomTooltip
        trigger={
          <DocumentFeedback
            documentId={documentId}
            messageId={messageId}
            documentRank={documentRank}
            feedbackType="endorse"
          />
        }
      >
        Good Response
      </CustomTooltip>
      <CustomTooltip
        trigger={
          <DocumentFeedback
            documentId={documentId}
            messageId={messageId}
            documentRank={documentRank}
            feedbackType="reject"
          />
        }
        variant="destructive"
      >
        Bad Response
      </CustomTooltip>
    </div>
  );
};
