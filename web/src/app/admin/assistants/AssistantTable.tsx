"use client";

import { Assistant } from "./interfaces";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { UniqueIdentifier } from "@dnd-kit/core";
import { DraggableTable } from "@/components/table/DraggableTable";
import { deleteAssistant, assistantComparator } from "./lib";
import { Pencil, Trash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CustomTooltip } from "@/components/CustomTooltip";
import { useUser } from "@/components/user/UserProvider";
import Link from "next/link";
import { DeleteModal } from "@/components/DeleteModal";
import { ASSISTANT_ERROR_MESSAGES } from "@/constants/error";
import { ASSISTANT_SUCCESS_MESSAGES } from "@/constants/success";

function AssistantTypeDisplay({ assistant }: { assistant: Assistant }) {
  if (assistant.builtin_assistant) {
    return <p className="whitespace-nowrap">Built-In</p>;
  }

  if (assistant.is_public) {
    return <p>Global</p>;
  }

  return <p>Private {assistant.owner && <>({assistant.owner.email})</>}</p>;
}

export function AssistantsTable({
  allAssistants,
  editableAssistants,
  teamspaceId,
  refreshAllAssistants,
}: {
  allAssistants: Assistant[];
  editableAssistants: Assistant[];
  teamspaceId?: string | string[];
  refreshAllAssistants: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { isLoadingUser, isAdmin, refreshUser } = useUser();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [assistantToDelete, setAssistantToDelete] = useState<Assistant | null>(
    null
  );

  const editableAssistantIds = useMemo(() => {
    return new Set(editableAssistants.map((p) => p.id.toString()));
  }, [editableAssistants]);

  const [finalAssistants, setFinalAssistants] = useState<Assistant[]>([]);

  useEffect(() => {
    const editable = editableAssistants.sort(assistantComparator);
    const nonEditable = allAssistants
      .filter((p) => !editableAssistantIds.has(p.id.toString()))
      .sort(assistantComparator);
    setFinalAssistants([...editable, ...nonEditable]);
  }, [editableAssistants, allAssistants, editableAssistantIds]);

  const updateAssistantOrder = async (
    orderedAssistantIds: UniqueIdentifier[]
  ) => {
    const reorderedAssistants = orderedAssistantIds.map(
      (id) => allAssistants.find((assistant) => assistant.id.toString() === id)!
    );

    setFinalAssistants(reorderedAssistants);

    const displayPriorityMap = new Map<UniqueIdentifier, number>();
    orderedAssistantIds.forEach((assistantId, ind) => {
      displayPriorityMap.set(assistantId, ind);
    });

    const response = await fetch("/api/admin/assistant/display-priority", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        display_priority_map: Object.fromEntries(displayPriorityMap),
      }),
    });

    if (!response.ok) {
      toast({
        title: ASSISTANT_ERROR_MESSAGES.ASSISTANT_ORDER_FAILED.title,
        description:
          ASSISTANT_ERROR_MESSAGES.ASSISTANT_ORDER_FAILED.description(
            await response.text()
          ),
        variant: "destructive",
      });
      setFinalAssistants(allAssistants);
      await refreshAllAssistants();
      return;
    }

    await refreshAllAssistants();
    await refreshUser();
  };

  if (isLoadingUser) {
    return <></>;
  }

  return (
    <div>
      {isDeleteModalOpen && assistantToDelete && (
        <DeleteModal
          title={`Are you sure you want to ${teamspaceId ? "remove" : "delete"} this assistant?`}
          description={`This action will permanently schedule the selected assistant will ${teamspaceId ? "remove" : "deletion"}. Please confirm if you want to proceed with this irreversible action.`}
          onClose={() => setIsDeleteModalOpen(false)}
          open={isDeleteModalOpen}
          onSuccess={async () => {
            const response = await deleteAssistant(
              assistantToDelete.id,
              teamspaceId
            );
            if (response.ok) {
              toast({
                title:
                  ASSISTANT_SUCCESS_MESSAGES.ASSISTANT_ACTION.title(
                    teamspaceId
                  ),
                description:
                  ASSISTANT_SUCCESS_MESSAGES.ASSISTANT_ACTION.description(
                    teamspaceId
                  ),
                variant: "success",
              });
              setIsDeleteModalOpen(false);
              refreshAllAssistants();
              router.refresh();
            } else {
              toast({
                title:
                  ASSISTANT_ERROR_MESSAGES.ASSISTANT_DELETE_FAILURE.title(
                    teamspaceId
                  ),
                description:
                  ASSISTANT_ERROR_MESSAGES.ASSISTANT_DELETE_FAILURE.description(
                    await response.text(),
                    teamspaceId
                  ),
                variant: "destructive",
              });
            }
          }}
        />
      )}

      <Card>
        <CardContent className="p-0">
          <DraggableTable
            headers={["Name", "Description", "Type", "Is Visible", ""]}
            isAdmin={isAdmin}
            rows={finalAssistants.map((assistant) => {
              return {
                id: assistant.id.toString(),
                cells: [
                  <CustomTooltip
                    key="name"
                    trigger={
                      assistant.builtin_assistant ? (
                        <div className="flex items-center w-full gap-2 truncate">
                          <p className="font-medium truncate text break-none">
                            {assistant.name}
                          </p>
                        </div>
                      ) : (
                        <Link
                          href={
                            teamspaceId
                              ? `/t/${teamspaceId}/admin/assistants/${assistant.id}`
                              : `/admin/assistants/${assistant.id}`
                          }
                          className="flex items-center w-full gap-2 truncate"
                        >
                          <Pencil size={16} className="shrink-0" />
                          <p className="font-medium truncate text break-none">
                            {assistant.name}
                          </p>
                        </Link>
                      )
                    }
                    align="start"
                    asChild
                  >
                    {assistant.name}
                  </CustomTooltip>,
                  <p key="description" className="max-w-2xl whitespace-normal">
                    {assistant.description}
                  </p>,
                  <AssistantTypeDisplay
                    key={assistant.id}
                    assistant={assistant}
                  />,
                  <Badge
                    key="is_visible"
                    onClick={async () => {
                      const response = await fetch(
                        `/api/admin/assistant/${assistant.id}/visible`,
                        {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            is_visible: !assistant.is_visible,
                          }),
                        }
                      );
                      if (response.ok) {
                        toast({
                          title:
                            ASSISTANT_SUCCESS_MESSAGES
                              .ASSISTANT_VISIBILITY_UPDATED.title,
                          description:
                            ASSISTANT_SUCCESS_MESSAGES.ASSISTANT_VISIBILITY_UPDATED.description(
                              assistant.name
                            ),
                          variant: "success",
                        });
                        refreshAllAssistants();
                        router.refresh();
                      } else {
                        toast({
                          title:
                            ASSISTANT_ERROR_MESSAGES
                              .ASSISTANT_UPDATE_VISIBILITY_FAILED.title,
                          description:
                            ASSISTANT_ERROR_MESSAGES.ASSISTANT_UPDATE_VISIBILITY_FAILED.description(
                              assistant.name,
                              await response.text()
                            ),
                          variant: "destructive",
                        });
                      }
                    }}
                    variant="outline"
                    className="py-1.5 px-3 w-[84px] cursor-pointer hover:bg-opacity-80 gap-1.5"
                  >
                    {!assistant.is_visible ? (
                      <div className="text-error">Hidden</div>
                    ) : (
                      "Visible"
                    )}

                    <Checkbox checked={assistant.is_visible} />
                  </Badge>,
                  <div key="edit" className="flex w-20">
                    <div className="mx-auto my-auto">
                      {!assistant.builtin_assistant ? (
                        <CustomTooltip
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setAssistantToDelete(assistant);
                                setIsDeleteModalOpen(true);
                              }}
                            >
                              <Trash size={16} />
                            </Button>
                          }
                          asChild
                          variant="destructive"
                        >
                          Delete
                        </CustomTooltip>
                      ) : (
                        "-"
                      )}
                    </div>
                  </div>,
                ],
                staticModifiers: [
                  [1, "lg:w-sidebar xl:w-[400px] 2xl:w-[550px]"],
                ],
              };
            })}
            setRows={updateAssistantOrder}
          />
        </CardContent>
      </Card>
    </div>
  );
}
