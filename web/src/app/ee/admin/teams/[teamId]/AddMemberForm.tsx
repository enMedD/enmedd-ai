import { updateTeamspace } from "./lib";
import { User, Teamspace } from "@/lib/types";
import { UserEditor } from "../UserEditor";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface AddMemberFormProps {
  users: User[];
  teamspace: Teamspace;
  onClose: () => void;
}

export const AddMemberForm: React.FC<AddMemberFormProps> = ({
  users,
  teamspace,
  onClose,
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const { toast } = useToast();

  return (
    <div>
      <UserEditor
        selectedUserIds={selectedUserIds}
        setSelectedUserIds={setSelectedUserIds}
        allUsers={users}
        existingUsers={teamspace.users}
        onSubmit={async (selectedUsers) => {
          const newUserIds = [
            ...Array.from(
              new Set(
                teamspace.users
                  .map((user) => user.id)
                  .concat(selectedUsers.map((user) => user.id))
              )
            ),
          ];
          const response = await updateTeamspace(teamspace.id, {
            user_ids: newUserIds,
            cc_pair_ids: teamspace.cc_pairs.map((ccPair) => ccPair.id),
          });
          if (response.ok) {
            toast({
              title: "Users Added Successfully!",
              description:
                "The selected users have been successfully added to the teamspace.",
              variant: "success",
            });
            onClose();
          } else {
            const responseJson = await response.json();
            const errorMsg = responseJson.detail || responseJson.message;
            toast({
              title: "Operation Failed",
              description: `Unable to add users to the teamspace: ${errorMsg}. Please try again.`,
              variant: "destructive",
            });
            onClose();
          }
        }}
      />
    </div>
  );
};
