"use client";

import { deleteAssistant } from "../lib";
import { useRouter } from "next/navigation";
import { SuccessfulAssistantUpdateRedirectType } from "../enums";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ASSISTANT_SUCCESS_MESSAGES } from "@/constants/toast/success";
import { ASSISTANT_ERROR_MESSAGES } from "@/constants/toast/error";

export function DeleteAssistantButton({
  assistantId,
  redirectType,
  teamspaceId,
  assistantName,
}: {
  assistantId: number;
  redirectType: SuccessfulAssistantUpdateRedirectType;
  teamspaceId?: string | string[];
  assistantName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <Button
      onClick={async () => {
        const response = await deleteAssistant(assistantId);
        if (response.ok) {
          toast({
            title: ASSISTANT_SUCCESS_MESSAGES.ASSISTANT_DELETED.title,
            description:
              ASSISTANT_SUCCESS_MESSAGES.ASSISTANT_DELETED.description(
                assistantName
              ),
            variant: "success",
          });
          const redirectUrl =
            redirectType === SuccessfulAssistantUpdateRedirectType.ADMIN
              ? teamspaceId
                ? `/t/${teamspaceId}/admin/assistants?u=${Date.now()}`
                : `/admin/assistants?u=${Date.now()}`
              : teamspaceId
                ? `/t/${teamspaceId}/chat`
                : `/chat`;

          router.push(redirectUrl);
        } else {
          toast({
            title: ASSISTANT_ERROR_MESSAGES.ASSISTANT_DELETE_FAILURE.title(),
            description:
              ASSISTANT_ERROR_MESSAGES.ASSISTANT_DELETE_FAILURE.description(
                await response.text()
              ),
            variant: "destructive",
          });
        }
      }}
      variant="destructive"
    >
      <Trash size={16} /> Delete Assistant
    </Button>
  );
}
