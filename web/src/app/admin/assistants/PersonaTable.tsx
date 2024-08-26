"use client";

import { Text } from "@tremor/react";
import { Assistant } from "./interfaces";
import { useRouter } from "next/navigation";
import { CustomCheckbox } from "@/components/CustomCheckbox";
import { usePopup } from "@/components/admin/connectors/Popup";
import { useState } from "react";
import { UniqueIdentifier } from "@dnd-kit/core";
import { DraggableTable } from "@/components/table/DraggableTable";
import { deleteAssistant, assistantComparator } from "./lib";
import { FiEdit2 } from "react-icons/fi";
import { TrashIcon } from "@/components/icons/icons";

function AssistantTypeDisplay({ assistant }: { assistant: Assistant }) {
  if (assistant.default_assistant) {
    return <Text>Built-In</Text>;
  }

  if (assistant.is_public) {
    return <Text>Global</Text>;
  }

  return (
    <Text>Assistantl {assistant.owner && <>({assistant.owner.email})</>}</Text>
  );
}

export function AssistantsTable({ assistants }: { assistants: Assistant[] }) {
  const router = useRouter();
  const { popup, setPopup } = usePopup();

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
      setPopup({
        type: "error",
        message: `Failed to update assistant order - ${await response.text()}`,
      });
      router.refresh();
    }
  };

  return (
    <div>
      {popup}

      <Text className="my-2">
        Assistants will be displayed as options on the Chat / Search interfaces
        in the order they are displayed below. Assistants marked as hidden will
        not be displayed.
      </Text>

      <DraggableTable
        headers={["Name", "Description", "Type", "Is Visible", "Delete"]}
        rows={finalAssistantValues.map((assistant) => {
          return {
            id: assistant.id.toString(),
            cells: [
              <div key="name" className="flex">
                {!assistant.default_assistant && (
                  <FiEdit2
                    className="mr-1 my-auto cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/admin/assistants/${assistant.id}?u=${Date.now()}`
                      )
                    }
                  />
                )}
                <p className="text font-medium whitespace-normal break-none">
                  {assistant.name}
                </p>
              </div>,
              <p
                key="description"
                className="whitespace-normal break-all max-w-2xl"
              >
                {assistant.description}
              </p>,
              <AssistantTypeDisplay key={assistant.id} assistant={assistant} />,
              <div
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
                    router.refresh();
                  } else {
                    setPopup({
                      type: "error",
                      message: `Failed to update assistant - ${await response.text()}`,
                    });
                  }
                }}
                className="px-1 py-0.5 hover:bg-hover-light rounded flex cursor-pointer select-none w-fit"
              >
                <div className="my-auto w-12">
                  {!assistant.is_visible ? (
                    <div className="text-error">Hidden</div>
                  ) : (
                    "Visible"
                  )}
                </div>
                <div className="ml-1 my-auto">
                  <CustomCheckbox checked={assistant.is_visible} />
                </div>
              </div>,
              <div key="edit" className="flex">
                <div className="mx-auto my-auto">
                  {!assistant.default_assistant ? (
                    <div
                      className="hover:bg-hover rounded p-1 cursor-pointer"
                      onClick={async () => {
                        const response = await deleteAssistant(assistant.id);
                        if (response.ok) {
                          router.refresh();
                        } else {
                          alert(
                            `Failed to delete assistant - ${await response.text()}`
                          );
                        }
                      }}
                    >
                      <TrashIcon />
                    </div>
                  ) : (
                    "-"
                  )}
                </div>
              </div>,
            ],
            staticModifiers: [[1, "lg:w-sidebar xl:w-[400px] 2xl:w-[550px]"]],
          };
        })}
        setRows={updateAssistantOrder}
      />
    </div>
  );
}
