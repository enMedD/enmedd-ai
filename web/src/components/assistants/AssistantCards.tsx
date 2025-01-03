import { CSS } from "@dnd-kit/utilities";

import { Assistant } from "@/app/admin/assistants/interfaces";
import { AssistantTools } from "@/app/assistants/ToolsDisplay";
import { Bubble } from "@/components/Bubble";
import { AssistantIcon } from "@/components/assistants/AssistantIcon";
import { getDisplayNameForModel } from "@/lib/hooks";
import { useSortable } from "@dnd-kit/sortable";
import React, { useState } from "react";
import { FiBookmark } from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";
import { Badge } from "../ui/badge";

export const AssistantCard = ({
  assistant,
  isSelected,
  onSelect,
  llmName,
}: {
  assistant: Assistant;
  isSelected: boolean;
  onSelect: (assistant: Assistant) => void;
  llmName: string;
}) => {
  const [hovering, setHovering] = useState(false);
  return (
    <div
      onClick={() => onSelect(assistant)}
      className={`
        p-4
        cursor-pointer
        border 
        ${isSelected ? "bg-hover" : "hover:bg-hover-light"}
        shadow-md 
        rounded-lg
        border-border
        grow
        flex items-center
        overflow-hidden 
      `}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="w-full">
        <div className="flex items-center mb-2">
          <AssistantIcon assistant={assistant} />
          <div className="ml-2 ellipsis truncate font-bold text-sm text-emphasis">
            {assistant.name}
          </div>
        </div>

        <div className="text-xs text-wrap text-subtle mb-2 mt-2 line-clamp-3 py-1">
          {assistant.description}
        </div>
        <div className="mt-2 flex flex-col gap-y-2">
          {assistant.document_sets.length > 0 && (
            <div className="text-xs text-subtle flex flex-wrap gap-2">
              <p className="my-auto font-medium">Document Sets:</p>
              {assistant.document_sets.map((set) => (
                <Badge key={set.id} variant="outline">
                  <FiBookmark />
                  <p className="w-full truncate">{set.name}</p>
                </Badge>
              ))}
            </div>
          )}
          <div className="text-xs text-subtle">
            <span className="font-semibold">Default model:</span>{" "}
            {getDisplayNameForModel(
              assistant.llm_model_version_override || llmName
            )}
          </div>
          <AssistantTools hovered={hovering} assistant={assistant} />
        </div>
      </div>
    </div>
  );
};

export function DraggableAssistantCard(props: {
  assistant: Assistant;
  isSelected: boolean;
  onSelect: (assistant: Assistant) => void;
  llmName: string;
  isLastAssistant: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.assistant.id.toString() });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`overlow-y-scroll inputscroll flex items-center ${props.isLastAssistant ? "pb-10" : ""}`}
    >
      <div {...attributes} {...listeners} className="mr-1 cursor-grab">
        <MdDragIndicator className="h-3 w-3 flex-none" />
      </div>

      <AssistantCard {...props} />
    </div>
  );
}
