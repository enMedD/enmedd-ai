"use client";

import { FiTrash } from "react-icons/fi";
import { deleteAssistant } from "../lib";
import { useRouter } from "next/navigation";
import { SuccessfulAssistantUpdateRedirectType } from "../enums";
import { Button } from "@/components/ui/button";

export function DeleteAssistantButton({
  assistantId,
  redirectType,
}: {
  assistantId: number;
  redirectType: SuccessfulAssistantUpdateRedirectType;
}) {
  const router = useRouter();

  return (
    <Button
      onClick={async () => {
        const response = await deleteAssistant(assistantId);
        if (response.ok) {
          router.push(
            redirectType === SuccessfulAssistantUpdateRedirectType.ADMIN
              ? `/admin/assistants?u=${Date.now()}`
              : `/chat`
          );
        } else {
          alert(`Failed to delete assistant - ${await response.text()}`);
        }
      }}
      variant="destructive"
    >
      <FiTrash className="mr-1.5" /> Delete
    </Button>
  );
}
