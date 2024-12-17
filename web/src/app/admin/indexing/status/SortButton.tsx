import { useState } from "react";
import { ArrowUpDown, ChevronDown } from "lucide-react";
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

interface SortButtonProps {
  currentSort: string | null;
  currentOrder: "asc" | "desc";
  onApplySort: (sort: string, order: "asc" | "desc") => void;
}

export const SortButton: React.FC<SortButtonProps> = ({
  currentSort,
  currentOrder,
  onApplySort,
}) => {
  const sorts = ["Activity", "Permission", "Total Docs", "Last Status"];

  const [localSort, setLocalSort] = useState<string | null>(currentSort);
  const [localOrder, setLocalOrder] = useState<"asc" | "desc">(currentOrder);

  const handleApply = () => {
    if (localSort) onApplySort(localSort, localOrder);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="border-input">
          <ArrowUpDown size={16} className="shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 space-y-5" align="start">
        <div>
          <h3>Sort Settings</h3>
          <p className="text-xs text-subtle">
            Settings changes auto-save and sync.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Sort by:</Label>
            <Select
              onValueChange={(value) => setLocalSort(value)}
              value={localSort || ""}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {sorts.map((sort) => (
                    <SelectItem key={sort} value={sort}>
                      {sort}
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
          <Button onClick={handleApply} disabled={!localSort}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
