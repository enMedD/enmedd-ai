"use client";

import { useState } from "react";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { CpuIcon, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WorkspaceSidebar } from "../WorkspaceSidebar";
import Link from "next/link";
import { CustomModal } from "@/components/CustomModal";
import CreateWorkspace from "./CreateWorkspace";
import ChoosePlan from "./ChoosePlan";

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
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openPlanModal, setOpenPlanModal] = useState(false);
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
      {openCreateModal && (
        <CustomModal
          trigger={null}
          onClose={() => setOpenCreateModal(false)}
          open={openCreateModal}
          title="Create Workspace"
          headerClassName="text-center text-3xl text-brand-500"
        >
          <CreateWorkspace
            onClose={() => setOpenCreateModal(false)}
            onOpenPlanModal={() => setOpenPlanModal(true)}
          />
        </CustomModal>
      )}

      {openPlanModal && (
        <CustomModal
          trigger={null}
          onClose={() => setOpenPlanModal(false)}
          open={openPlanModal}
          title="Choose your plan"
          headerClassName="text-center text-3xl text-brand-500"
        >
          <ChoosePlan onCancel={() => setOpenPlanModal(false)} />
        </CustomModal>
      )}

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
            <Button onClick={() => setOpenCreateModal(true)}>
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
              <CardContent className="relative flex flex-col justify-between h-56 bg-muted/50">
                <div className="absolute top-0 w-12 h-12 -translate-y-1/2 right-4 flex items-center justify-center">
                  <span className="text-xl uppercase font-bold h-full flex items-center justify-center rounded-lg text-inverted border-[5px] border-inverted w-full bg-brand-500">
                    L
                  </span>
                </div>
                <div className="text-subtle">
                  <div className="pb-4 text-sm">
                    <h2 className="w-full font-bold truncate flex text-lg">
                      <span className="inline truncate text-default">
                        Legendary Name
                      </span>
                    </h2>
                    <div className="space-x-2">
                      <span className="text-brand-500">@JohnDoe</span>
                      <span>12-03-2024</span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <p className="flex gap-2 items-center">
                        <Users size={14} className="shrink-0" /> 20,023 Memebers
                      </p>
                      <p className="flex gap-2 items-center">
                        <CpuIcon size={14} className="shrink-0" /> 12 Assistants
                      </p>
                    </div>
                  </div>

                  <p className="text-sm line-clamp">
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Velit quam voluptatum non et deserunt magni porro nihil
                    quaerat perferendis quas? Debitis voluptatum totam dicta ab
                    cumque non accusamus, esse laudantium!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
};

export default function Page() {
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
}
