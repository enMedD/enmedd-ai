import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
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
import { usePathname, useSearchParams } from "next/navigation";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateQueryParams = (key: string, value: string | number | null) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (value) {
      newParams.set(key, value.toString());
    } else {
      newParams.delete(key);
    }

    const newUrl = `${pathname}?${newParams.toString()}`;
    window.history.pushState({}, "", newUrl);

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
          <Button variant="outline" size="icon">
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
                  updateQueryParams("activity", "Active");
                }}
              >
                Active
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setActivityFilter("Pause");
                  updateQueryParams("activity", "Pause");
                }}
              >
                Pause
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setActivityFilter("Deleting");
                  updateQueryParams("activity", "Deleting");
                }}
              >
                Deleting
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setActivityFilter("not_started");
                  updateQueryParams("activity", "not_started");
                }}
              >
                Scheduled
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setActivityFilter("in_progress");
                  updateQueryParams("activity", "in_progress");
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
                  updateQueryParams("permissions", "Public");
                }}
              >
                Public
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setPermissionsFilter("Private");
                  updateQueryParams("permissions", "Private");
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
                  updateQueryParams("docs", 0);
                }}
              >
                0
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setDocsFilter(10);
                  updateQueryParams("docs", 10);
                }}
              >
                10+
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setDocsFilter(100);
                  updateQueryParams("docs", 100);
                }}
              >
                100+
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setDocsFilter(1000);
                  updateQueryParams("docs", 1000);
                }}
              >
                1000+
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setDocsFilter(10000);
                  updateQueryParams("docs", 10000);
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
                  updateQueryParams("status", "success");
                }}
              >
                Success
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setStatusFilter("in_progress");
                  updateQueryParams("status", "in_progress");
                }}
              >
                Scheduled
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setStatusFilter("not_started");
                  updateQueryParams("status", "not_started");
                }}
              >
                Not Started
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setStatusFilter("failed");
                  updateQueryParams("status", "failed");
                }}
              >
                Failed
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  setStatusFilter("completed_with_errors");
                  updateQueryParams("status", "completed_with_errors");
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
