import { Button } from "./ui/button";
import { Trash } from "lucide-react";

export function DeleteButton({
  onClick,
  disabled,
}: {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void | Promise<void>;
  disabled?: boolean;
}) {
  return (
    <Button onClick={onClick} variant="destructive" disabled={disabled}>
      <Trash className="mr-1 my-auto" size={16} />
      Delete
    </Button>
  );
}
