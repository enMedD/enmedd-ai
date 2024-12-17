import { useState } from "react";
import { ChevronDown, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GroupButtonProps {
  currentGroup: string | null;
  currentOrder: "asc" | "desc";
  onApplyGroup: (group: string, order: "asc" | "desc") => void;
}

export const GroupButton: React.FC<GroupButtonProps> = ({
  currentGroup,
  currentOrder,
  onApplyGroup,
}) => {
  const groups = ["Activity", "Permission", "Last Status"];

  const [localGroup, setLocalGroup] = useState<string | null>(currentGroup);
  const [localOrder, setLocalOrder] = useState<"asc" | "desc">(currentOrder);

  const handleApply = () => {
    if (localGroup) onApplyGroup(localGroup, localOrder);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="border-input">
          <ListFilter size={16} className="shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 space-y-5" align="start">
        <div>
          <h3>Group Settings</h3>
          <p className="text-xs text-subtle">
            Settings changes auto-save and sync.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Group by:</Label>
            <Select
              onValueChange={(value) => setLocalGroup(value)}
              value={localGroup || ""}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {groups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Order:</Label>
            <div className="flex gap-2">
              <Button
                variant={localOrder === "asc" ? "default" : "outline"}
                onClick={() => setLocalOrder("asc")}
              >
                Ascending
              </Button>
              <Button
                variant={localOrder === "desc" ? "default" : "outline"}
                onClick={() => setLocalOrder("desc")}
              >
                Descending
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleApply} disabled={!localGroup}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
