"use client";

import { SidebarContent } from "@/components/ui/sidebar";

interface WorkspacSidebarProps {}

export const WorkspaceSidebar = ({}: WorkspacSidebarProps) => {
  return (
    <SidebarContent>
      {/* {selectedTeamspace && ( */}
      <>
        <div className="h-40 relative shrink-0 bg-brand-500">
          <div className="absolute top-full -translate-y-1/2 left-1/2 -translate-x-1/2">
            <span className="text-3xl uppercase font-bold min-w-16 min-h-16 flex items-center justify-center rounded-full text-inverted border-[5px] border-inverted shrink-0 bg-brand-50">
              G
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center px-6 py-14 w-full">
          <div className="flex flex-col items-center gap-2 w-full">
            <div></div>

            <div></div>
            <span className="text-center text-primary pt-1 font-medium text-sm">
              Lorem Ipsum
            </span>
            <span className="text-center pt-4 font-bold text-sm flex items-center gap-1">
              10
            </span>
          </div>

          <div className="w-full flex flex-col gap-4 pt-14"></div>
        </div>
      </>
      {/* )} */}
    </SidebarContent>
  );
};
