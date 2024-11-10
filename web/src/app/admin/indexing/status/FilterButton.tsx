import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";

export default function FilterButton() {
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
              <MenubarItem>Active</MenubarItem>
              <MenubarItem>Pause</MenubarItem>
              <MenubarItem>Deleting</MenubarItem>
              <MenubarItem>Scheduled</MenubarItem>
              <MenubarItem>Indexing</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>

          <MenubarSub>
            <MenubarSubTrigger>Permissions</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>Public</MenubarItem>
              <MenubarItem>Private</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>

          <MenubarSub>
            <MenubarSubTrigger>Total Docs</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>0</MenubarItem>
              <MenubarItem>100</MenubarItem>
              <MenubarItem>1000</MenubarItem>
              <MenubarItem>10000</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>

          <MenubarSub>
            <MenubarSubTrigger>Last Status</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>In Progress</MenubarItem>
              <MenubarItem>Not Started</MenubarItem>
              <MenubarItem>Succeeded</MenubarItem>
              <MenubarItem>Failed</MenubarItem>
              <MenubarItem>Scheduled</MenubarItem>
              <MenubarItem>Completed with errors</MenubarItem>
              <MenubarItem>None</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
