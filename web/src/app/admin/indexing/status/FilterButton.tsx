import { Button } from "@/components/ui/button";
import { ChevronDown, Filter } from "lucide-react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useEffect } from "react";

export default function FilterButton({
  setActivityFilter,
  setPermissionsFilter,
  setDocsFilter,
  setStatusFilter,
}: {
  setActivityFilter: (value: string | null) => void;
  setPermissionsFilter: (value: string | null) => void;
  setDocsFilter: (value: number | null) => void;
  setStatusFilter: (value: string | null) => void;
}) {
  const updateLocalStorage = (key: string, value: string | number | null) => {
    localStorage.setItem(key, value?.toString() || "");
  };

  // Load filters from localStorage
  useEffect(() => {
    const savedActivityFilter = localStorage.getItem("activity");
    const savedPermissionsFilter = localStorage.getItem("permissions");
    const savedDocsFilter = localStorage.getItem("docs");
    const savedStatusFilter = localStorage.getItem("status");

    if (savedActivityFilter) setActivityFilter(savedActivityFilter);
    if (savedPermissionsFilter) setPermissionsFilter(savedPermissionsFilter);
    if (savedDocsFilter) setDocsFilter(Number(savedDocsFilter));
    if (savedStatusFilter) setStatusFilter(savedStatusFilter);
  }, [setActivityFilter, setPermissionsFilter, setDocsFilter, setStatusFilter]);

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>
          <Button variant="outline" size="icon" className="border-input">
            <Filter size={16} className="shrink-0" />
          </Button>
        </MenubarTrigger>
        <MenubarContent>
          <MenubarSub>
            <MenubarSubTrigger>Activity</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem
                onClick={() => {
                  setActivityFilter("Active");
                  updateLocalStorage("activity", "Active");
                }}
              >
                Active
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setActivityFilter("Pause");
                  updateLocalStorage("activity", "Pause");
                }}
              >
                Pause
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setActivityFilter("Deleting");
                  updateLocalStorage("activity", "Deleting");
                }}
              >
                Deleting
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setActivityFilter("not_started");
                  updateLocalStorage("activity", "not_started");
                }}
              >
                Scheduled
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setActivityFilter("in_progress");
                  updateLocalStorage("activity", "in_progress");
                }}
              >
                Indexing
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>

          <MenubarSub>
            <MenubarSubTrigger>Permissions</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem
                onClick={() => {
                  setPermissionsFilter("Public");
                  updateLocalStorage("permissions", "Public");
                }}
              >
                Public
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setPermissionsFilter("Private");
                  updateLocalStorage("permissions", "Private");
                }}
              >
                Private
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>

          <MenubarSub>
            <MenubarSubTrigger>Total Docs</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem
                onClick={() => {
                  setDocsFilter(0);
                  updateLocalStorage("docs", 0);
                }}
              >
                0
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setDocsFilter(10);
                  updateLocalStorage("docs", 10);
                }}
              >
                10+
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setDocsFilter(100);
                  updateLocalStorage("docs", 100);
                }}
              >
                100+
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setDocsFilter(1000);
                  updateLocalStorage("docs", 1000);
                }}
              >
                1000+
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setDocsFilter(10000);
                  updateLocalStorage("docs", 10000);
                }}
              >
                10000+
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>

          <MenubarSub>
            <MenubarSubTrigger>Last Status</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem
                onClick={() => {
                  setStatusFilter("success");
                  updateLocalStorage("status", "success");
                }}
              >
                Success
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setStatusFilter("in_progress");
                  updateLocalStorage("status", "in_progress");
                }}
              >
                Scheduled
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setStatusFilter("not_started");
                  updateLocalStorage("status", "not_started");
                }}
              >
                Not Started
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setStatusFilter("failed");
                  updateLocalStorage("status", "failed");
                }}
              >
                Failed
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setStatusFilter("completed_with_errors");
                  updateLocalStorage("status", "completed_with_errors");
                }}
              >
                Completed with errors
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
