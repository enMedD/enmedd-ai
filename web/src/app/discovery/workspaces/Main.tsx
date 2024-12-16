"use client";

import { useState } from "react";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Cpu, File, Plus, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WorkspaceSidebar } from "./WorkspaceSidebar";

const Inset = ({
  open,
  openFalse,
  openTrue,
  selectedTeamspaceId,
  setSelectedTeamspaceId,
}: {
  open: boolean;
  openFalse: () => void;
  openTrue: () => void;
  selectedTeamspaceId: number | null;
  setSelectedTeamspaceId: (teamspaceId: number) => void;
}) => {
  const { toggleSidebar: toggleRightSidebar, isMobile } = useSidebar();

  const handleCloseSidebar = () => {
    openFalse();
  };

  const handleShowTeamspace = (teamspaceId: number) => {
    if (selectedTeamspaceId === teamspaceId) {
      if (open) {
        openFalse();
      } else {
        openTrue();
      }
    } else {
      setSelectedTeamspaceId(teamspaceId);
      if (!open) openTrue();
    }
    if (!teamspaceId || isMobile) {
      toggleRightSidebar();
    }
  };

  return (
    <SidebarInset className="w-full overflow-hidden">
      <header className="flex h-16 shrink-0 items-center gap-2 px-4 absolute top-0 right-0">
        {open && (
          <SidebarTrigger className="-mr-1" onClick={handleCloseSidebar} />
        )}
      </header>
      <div className="h-full w-full overflow-y-auto">
        <div className="container space-y-10">
          <div className="w-full flex justify-between items-center">
            <h1 className="flex items-center font-bold text-xl md:text-[28px] text-strong gap-x-2">
              Workspace Management
            </h1>
            <Button>
              <Plus size={16} />
              Create Workspace
            </Button>
          </div>

          <div className="w-full flex items-center justify-center">
            <Input placeholder="Search workspace..." className="w-3/4" />
          </div>

          <div className="flex flex-wrap gap-6 pt-10">
            <Card
              className="overflow-hidden !rounded-xl cursor-pointer w-full max-w-[400px] justify-start items-start"
              onClick={() => handleShowTeamspace(1)}
            >
              <CardHeader className="p-10 bg-brand-500"></CardHeader>
              <CardContent className="relative flex flex-col justify-between min-h-48 bg-muted/50">
                <div className="absolute top-0 w-12 h-12 -translate-y-1/2 right-4 flex items-center justify-center">
                  <span className="text-xl uppercase font-bold h-full flex items-center justify-center rounded-lg text-inverted border-[5px] border-inverted w-full bg-brand-500">
                    L
                  </span>
                </div>
                <div className="pb-6">
                  <h2 className="w-full font-bold truncate flex">
                    <span className="inline truncate">Legendary Name</span>
                  </h2>
                  <span className="text-sm text-subtle">John Doe</span>
                </div>

                <div className="w-full grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] text-sm gap-y-2 gap-x-6 font-light">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="shrink-0" />
                    <span className="whitespace-nowrap">10 Members</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Cpu size={16} className="shrink-0" />
                    <span className="whitespace-nowrap">10 Assistant</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <File size={16} className="shrink-0" />
                    <span className="whitespace-nowrap">10 Document Set</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Shield size={16} className="shrink-0" />
                    <span className="whitespace-nowrap">10 Data Source</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
};

export const Main = () => {
  const [open, setOpen] = useState(false);
  const [selectedTeamspaceId, setSelectedTeamspaceId] = useState<number | null>(
    null
  );

  return (
    <SidebarProvider
      open={open}
      onOpenChange={setOpen}
      style={
        {
          "--sidebar-width": "400px",
        } as React.CSSProperties
      }
      className="h-full w-full"
    >
      <Inset
        open={open}
        openFalse={() => setOpen(false)}
        openTrue={() => setOpen(true)}
        selectedTeamspaceId={selectedTeamspaceId}
        setSelectedTeamspaceId={setSelectedTeamspaceId}
      />

      <Sidebar
        className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
        side="right"
      >
        <WorkspaceSidebar />
      </Sidebar>
    </SidebarProvider>
  );
};
