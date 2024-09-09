"use client";

import { deleteCustomTool } from "@/lib/tools/edit";
import { Button } from "@tremor/react";
import { useRouter } from "next/navigation";
import { FiTrash } from "react-icons/fi";

export function DeleteToolButton({ toolId }: { toolId: number }) {
  const router = useRouter();

  return (
    <Button
      size="xs"
      color="red"
      onClick={async () => {
        const response = await deleteCustomTool(toolId);
        if (response.data) {
          router.push(`/admin/tools?u=${Date.now()}`);
        } else {
          alert(`Failed to delete tool - ${response.error}`);
        }
      }}
      icon={FiTrash}
    >
      Delete
    </Button>
  );
}
