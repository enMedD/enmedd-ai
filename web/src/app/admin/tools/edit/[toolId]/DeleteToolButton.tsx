"use client";

import { deleteCustomTool } from "@/lib/tools/edit";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TOOL_SUCCESS_MESSAGES } from "@/constants/success";
import { OPERATION_ERROR_MESSAGES } from "@/constants/error";

export function DeleteToolButton({
  toolId,
  teamspaceId,
}: {
  toolId: number;
  teamspaceId?: string | string[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <Button
      onClick={async () => {
        const response = await deleteCustomTool(toolId);
        if (response.data) {
          router.push(
            teamspaceId
              ? `/t/${teamspaceId}/admin/tools?u=${Date.now()}`
              : `/admin/tools?u=${Date.now()}`
          );
          toast({
            title: TOOL_SUCCESS_MESSAGES.DELETE.title,
            description: TOOL_SUCCESS_MESSAGES.DELETE.description,
            variant: "success",
          });
        } else {
          toast({
            title: OPERATION_ERROR_MESSAGES.ACTION.title("Deletion"),
            description: OPERATION_ERROR_MESSAGES.ACTION.description(
              "tool",
              "delete",
              response.error
            ),
            variant: "destructive",
          });
        }
      }}
      variant="destructive"
    >
      <Trash size={16} /> Delete
    </Button>
  );
}
