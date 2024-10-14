"use client";

import { Assistant } from "./interfaces";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UniqueIdentifier } from "@dnd-kit/core";
import { DraggableTable } from "@/components/table/DraggableTable";
import { deleteAssistant, assistantComparator } from "./lib";
import { TrashIcon } from "@/components/icons/icons";
import { Pencil, Trash, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CustomTooltip } from "@/components/CustomTooltip";

function AssistantTypeDisplay({ assistant }: { assistant: Assistant }) {
  if (assistant.default_assistant) {
    return <p className="whitespace-nowrap">Built-In</p>;
  }

  if (assistant.is_public) {
    return <p>Global</p>;
  }

  return <p>Assistant {assistant.owner && <>({assistant.owner.email})</>}</p>;
}

export function AssistantsTable({ assistants }: { assistants: Assistant[] }) {
  const router = useRouter();
  const { toast } = useToast();

  const availableAssistantIds = new Set(
    assistants.map((assistant) => assistant.id.toString())
  );
  const sortedAssistants = [...assistants];
  sortedAssistants.sort(assistantComparator);

  const [finalAssistants, setFinalAssistants] = useState<string[]>(
    sortedAssistants.map((assistant) => assistant.id.toString())
  );
  const finalAssistantValues = finalAssistants
    .filter((id) => availableAssistantIds.has(id))
    .map((id) => {
      return sortedAssistants.find(
        (assistant) => assistant.id.toString() === id
      ) as Assistant;
    });

  const updateAssistantOrder = async (
    orderedAssistantIds: UniqueIdentifier[]
  ) => {
    setFinalAssistants(orderedAssistantIds.map((id) => id.toString()));

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
        title: "Failed to Update Assistant Order",
        description: `There was an issue updating the assistant order. Details: ${await response.text()}`,
        variant: "destructive",
      });
      router.refresh();
    }
  };

  return (
    <div>
      <p className="pb-4 text-sm">
        Assistants will be displayed as options on the Chat / Search interfaces
        in the order they are displayed below. Assistants marked as hidden will
        not be displayed.
      </p>

      <Card>
        <CardContent className="p-0">
          <DraggableTable
            headers={["Name", "Description", "Type", "Is Visible", "Delete"]}
            rows={finalAssistantValues.map((assistant) => {
              return {
                id: assistant.id.toString(),
                cells: [
                  <div
                    key="name"
                    className="flex gap-4 items-center"
                    onClick={() =>
                      router.push(
                        `/admin/assistants/${assistant.id}?u=${Date.now()}`
                      )
                    }
                  >
                    {!assistant.default_assistant && <Pencil size={16} />}
                    <p className="text font-medium whitespace-normal break-none">
                      {assistant.name}
                    </p>
                  </div>,
                  <p key="description" className="whitespace-normal max-w-2xl">
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
                          title: "Visibility Updated",
                          description: `The visibility of "${assistant.name}" has been successfully updated.`,
                          variant: "success",
                        });

                        router.refresh();
                      } else {
                        toast({
                          title: "Failed to Update Assistant Visibility",
                          description: `Unable to update visibility for "${assistant.name}". Details: ${await response.text()}`,
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
                  <div key="edit" className="flex">
                    <div className="mx-auto my-auto">
                      {!assistant.default_assistant ? (
                        <CustomTooltip
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                const response = await deleteAssistant(
                                  assistant.id
                                );
                                if (response.ok) {
                                  toast({
                                    title: "Assistant deleted",
                                    description:
                                      "The assistant has been successfully deleted.",
                                    variant: "success",
                                  });
                                  router.refresh();
                                } else {
                                  toast({
                                    title: "Failed to delete assistant",
                                    description: `There was an issue deleting the assistant. Details: ${await response.text()}`,
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <Trash size={16} />
                            </Button>
                          }
                          asChild
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
