import { useState } from "react";
import { Modal } from "@/components/Modal";
import { MinimalUserSnapshot, User } from "@/lib/types";
import { Button, Text } from "@tremor/react";
import { Assistant } from "@/app/admin/assistants/interfaces";
import { SearchMultiSelectDropdown } from "@/components/Dropdown";
import { UsersIcon } from "@/components/icons/icons";
import { AssistantSharedStatusDisplay } from "../AssistantSharedStatus";
import {
  addUsersToAssistantSharedList,
  removeUsersFromAssistantSharedList,
} from "@/lib/assistants/shareAssistant";
import { Bubble } from "@/components/Bubble";
import { useRouter } from "next/navigation";
import { AssistantIcon } from "@/components/assistants/AssistantIcon";
import { Spinner } from "@/components/Spinner";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";
import { CustomModal } from "@/components/CustomModal";

interface AssistantSharingModalProps {
  assistant: Assistant;
  user: User | null;
  allUsers: MinimalUserSnapshot[];
  show: boolean;
  onClose: () => void;
}

export function AssistantSharingModal({
  assistant,
  user,
  allUsers,
  show,
  onClose,
}: AssistantSharingModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<MinimalUserSnapshot[]>([]);

  const assistantName = assistant.name;
  const sharedUsersWithoutOwner = assistant.users.filter(
    (u) => u.id !== assistant.owner?.id
  );

  if (!show) {
    return null;
  }

  const handleShare = async () => {
    setIsUpdating(true);
    const startTime = Date.now();

    const error = await addUsersToAssistantSharedList(
      assistant,
      selectedUsers.map((user) => user.id)
    );
    router.refresh();

    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, 1000 - elapsedTime);

    setTimeout(() => {
      setIsUpdating(false);
      if (error) {
        toast({
          title: "Sharing Failed",
          description: `We encountered an issue while trying to share "${assistant.name}". Please try again later.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Assistant Shared",
          description: `"${assistant.name}" has been successfully shared with the selected users!`,
          variant: "success",
        });
      }
    }, remainingTime);
  };

  let sharedStatus = null;
  if (assistant.is_public || !sharedUsersWithoutOwner.length) {
    sharedStatus = (
      <AssistantSharedStatusDisplay
        size="md"
        assistant={assistant}
        user={user}
      />
    );
  } else {
    sharedStatus = (
      <div>
        Shared with:{" "}
        <div className="flex flex-wrap gap-x-2 mt-2">
          {sharedUsersWithoutOwner.map((u) => (
            <Bubble
              key={u.id}
              isSelected={false}
              onClick={async () => {
                setIsUpdating(true);
                const startTime = Date.now();

                const error = await removeUsersFromAssistantSharedList(
                  assistant,
                  [u.id]
                );
                router.refresh();

                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, 1000 - elapsedTime);

                setTimeout(() => {
                  setIsUpdating(false);
                  if (error) {
                    toast({
                      title: "Removal Failed",
                      description: `Unable to remove "${u.email}" from the assistant's shared list. Please try again later.`,
                      variant: "destructive",
                    });
                  } else {
                    toast({
                      title: "User Removed",
                      description: `"${u.email}" has been successfully removed from the assistant's shared list.`,
                      variant: "success",
                    });
                  }
                }, remainingTime);
              }}
            >
              <div className="flex">
                {u.email} <X className="ml-1 my-auto" />
              </div>
            </Bubble>
          ))}
        </div>
      </div>
    );
  }

  return (
    <CustomModal
      title={
        <div className="flex">
          <AssistantIcon assistant={assistant} />{" "}
          <div className="ml-2 my-auto">{assistantName}</div>
        </div>
      }
      onClose={onClose}
      trigger={null}
      open={show}
    >
      <div className="px-4">
        {isUpdating && <Spinner />}
        <Text className="mb-5">
          Control which other users should have access to this assistant.
        </Text>

        <div>
          <p className="font-bold mb-2">Current status:</p>
          {sharedStatus}
        </div>

        <h3 className="mb-4 mt-3">Share Assistant:</h3>
        <div className="mt-4">
          <SearchMultiSelectDropdown
            options={allUsers
              .filter(
                (u1) =>
                  !selectedUsers.map((u2) => u2.id).includes(u1.id) &&
                  !sharedUsersWithoutOwner.map((u2) => u2.id).includes(u1.id) &&
                  u1.id !== user?.id
              )
              .map((user) => {
                return {
                  name: user.email,
                  value: user.id,
                };
              })}
            onSelect={(option) => {
              setSelectedUsers([
                ...Array.from(
                  new Set([
                    ...selectedUsers,
                    { id: option.value as string, email: option.name },
                  ])
                ),
              ]);
            }}
            itemComponent={({ option }) => (
              <div className="flex px-4 py-2.5 cursor-pointer hover:bg-hover">
                <UsersIcon className="mr-2 my-auto" />
                {option.name}
                <div className="ml-auto my-auto">
                  <Plus />
                </div>
              </div>
            )}
          />
          <div className="mt-2 flex flex-wrap gap-x-2">
            {selectedUsers.length > 0 &&
              selectedUsers.map((selectedUser) => (
                <div
                  key={selectedUser.id}
                  onClick={() => {
                    setSelectedUsers(
                      selectedUsers.filter(
                        (user) => user.id !== selectedUser.id
                      )
                    );
                  }}
                  className={`
                      flex 
                      rounded-regular 
                      px-2 
                      py-1 
                      border 
                      border-border 
                      hover:bg-hover-light 
                      cursor-pointer`}
                >
                  {selectedUser.email} <X className="ml-1 my-auto" />
                </div>
              ))}
          </div>

          {selectedUsers.length > 0 && (
            <Button
              className="mt-4"
              onClick={() => {
                handleShare();
                setSelectedUsers([]);
              }}
              size="xs"
              color="blue"
            >
              Add
            </Button>
          )}
        </div>
      </div>
    </CustomModal>
  );
}
