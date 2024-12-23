"use client";

import { Button } from "@/components/ui/button";
import { SidebarContent } from "@/components/ui/sidebar";

interface WorkspacSidebarProps {}

export const WorkspaceSidebar = ({}: WorkspacSidebarProps) => {
  return (
    <SidebarContent>
      {/* {selectedWorkspace && ( */}
      <>
        <div className="h-40 relative shrink-0 bg-brand-500">
          <div className="absolute top-full -translate-y-1/2 left-1/2 -translate-x-1/2">
            <span className="text-3xl uppercase font-bold size-20 flex items-center justify-center rounded-full text-inverted border-[5px] border-inverted shrink-0 bg-brand-50">
              G
            </span>
          </div>
        </div>

        <div className="px-6 pt-14 pb-6 h-full flex flex-col justify-between">
          <div className="flex flex-col items-center w-full">
            <h1 className="text-center font-bold text-xl md:text-[28px] w-full px-4 flex justify-center text-strong">
              Workspace Name
            </h1>
            <span className="text-center text-brand-500 font-medium text-sm pt-2">
              Workspace Owner
            </span>
            <p className="line-clamp text-sm text-center px-4 break-all cursor-pointer pt-5">
              Lorem ipsum dolor sit, amet consectetur adipisicing elit. Porro
              aperiam esse, similique excepturi distinctio ducimus dolorem
              inventore adipisci expedita error ratione molestias quibusdam
              reiciendis natus voluptatem dolores ut necessitatibus atque!
            </p>
          </div>

          <div className="pt-14 space-y-4">
            <div className="w-full flex flex-col gap-4">
              <div className="rounded-md bg-background-subtle w-full p-4 min-h-24 flex flex-col justify-between">
                <h3>
                  Members <span className="px-2 font-normal">|</span> 10
                </h3>

                <div className="pt-8 flex flex-wrap -space-x-3">
                  <div className="bg-background w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">
                    +10
                  </div>
                </div>
                {/* {teamspace.users.length > 0 ? (
                  <div className="pt-8 flex flex-wrap -space-x-3">
                    {usersToDisplay.map((user) => (
                      <CustomTooltip
                        variant="white"
                        key={user.id}
                        trigger={<UserProfile user={user} />}
                      >
                        {user.email == teamspace.creator.email && (
                          <Crown size={16} className="me-2" />
                        )}
                        {user.full_name}
                      </CustomTooltip>
                    ))}
                    {teamspace.users.length > 8 && (
                      <div className="bg-background w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">
                        +10
                      </div>
                    )}
                  </div>
                ) : (
                  <p>There are no member.</p>
                )} */}
              </div>
            </div>

            <div className="w-full flex flex-col gap-4">
              <div className="rounded-md bg-background-subtle w-full p-4 min-h-24 flex flex-col justify-between">
                <h3>
                  Assistants <span className="px-2 font-normal">|</span> 10
                </h3>

                <div className="pt-8 flex flex-wrap -space-x-3">
                  <div className="bg-background w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">
                    +10
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full mt-auto pt-6">
            <Button className="w-full">Join Workspace</Button>
          </div>
        </div>
      </>
      {/* )} */}
    </SidebarContent>
  );
};
