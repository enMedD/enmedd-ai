import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragHandle } from "./DragHandle";
import { Row } from "./interfaces";
import { TableCell, TableRow } from "../ui/table";

export function DraggableRow({
  row,
  forceDragging,
  onClick,
}: {
  row: Row;
  forceDragging?: boolean;
  onClick?: () => void;
}) {
  const {
    attributes,
    listeners,
    transform,
    transition,
    setNodeRef,
    isDragging,
  } = useSortable({
    id: row.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer ${isDragging ? "invisible" : "bg-background"}`}
      onClick={onClick}
    >
      <TableCell>
        <DragHandle
          isDragging={isDragging || forceDragging}
          {...attributes}
          {...listeners}
        />
      </TableCell>
      {row.cells.map((column, ind) => (
        <TableCell key={ind} className={ind === 1 ? "min-w-72 md:min-w-0" : ""}>
          {column}
        </TableCell>
      ))}
    </TableRow>
  );
}
