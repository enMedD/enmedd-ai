"use client";

import { BulkAddTeamspace } from "@/components/admin/users/BulkAddTeamspace";
import { CustomModal } from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useState } from "react";

export const AddUserButton = ({
  teamspaceId,
  refreshUsers,
}: {
  teamspaceId?: string | string[];
  refreshUsers: () => void;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <CustomModal
      title="Bulk Add Users"
      onClose={() => setIsModalOpen(false)}
      open={isModalOpen}
      trigger={
        <Button onClick={() => setIsModalOpen(true)} variant="outline">
          <UserPlus size={16} />
          Add People
        </Button>
      }
    >
      <BulkAddTeamspace
        teamspaceId={teamspaceId}
        refreshUsers={refreshUsers}
        onClose={() => setIsModalOpen(false)}
      />
    </CustomModal>
  );
};
