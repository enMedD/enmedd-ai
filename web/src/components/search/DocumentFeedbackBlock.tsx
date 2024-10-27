import { Lightbulb } from "@phosphor-icons/react/dist/ssr";
import { PopupSpec } from "../admin/connectors/Popup";
import {
  BookmarkIcon,
  ChevronsDownIcon,
  ChevronsUpIcon,
  LightBulbIcon,
  LightSettingsIcon,
} from "../icons/icons";
import { CustomTooltip } from "../tooltip/CustomTooltip";
import { useToast } from "@/hooks/use-toast";

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
        className="my-auto flex flex-shrink-0 text-blue-400"
      />
    );
  }
  if (feedbackType === "reject") {
    icon = (
      <ChevronsDownIcon
        size={size}
        className="my-auto flex flex-shrink-0 text-blue-400"
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
            title: "Feedback Submitted",
            description: "Thanks for your feedback!",
            variant: "success",
          });
        } else {
          toast({
            title: "Feedback Error",
            description: `Error giving feedback - ${errorMsg}`,
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
      <CustomTooltip showTick line content="Good response">
        <DocumentFeedback
          documentId={documentId}
          messageId={messageId}
          documentRank={documentRank}
          feedbackType="endorse"
        />
      </CustomTooltip>
      <CustomTooltip showTick line content="Bad response">
        <DocumentFeedback
          documentId={documentId}
          messageId={messageId}
          documentRank={documentRank}
          feedbackType="reject"
        />
      </CustomTooltip>
    </div>
  );
};
