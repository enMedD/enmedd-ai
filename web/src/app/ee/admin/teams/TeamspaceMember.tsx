"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Teamspace } from "@/lib/types";
import React from "react";

interface TeamspaceMemberProps {
  teamspace: Teamspace & { gradient: string };
}

export const TeamspaceMember = ({ teamspace }: TeamspaceMemberProps) => {
  const [open, setOpen] = React.useState(false);
  const [opens, setOpens] = React.useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <div className="rounded-md bg-muted w-full p-4 min-h-32 flex flex-col justify-between cursor-pointer">
            <div className="flex items-center justify-between">
              <h3>
                Members <span className="px-2 font-normal">|</span>{" "}
                {teamspace.users.length}
              </h3>
              <Dialog open={opens} onOpenChange={setOpens}>
                <DialogTrigger asChild>
                  <Button onClick={(e) => e.stopPropagation()}>Invite</Button>
                </DialogTrigger>
                <DialogContent className="bg-red-500">
                  Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                  Autem eaque magni tenetur, optio commodi earum ipsa aperiam
                  eligendi molestiae, debitis totam maxime error omnis rerum
                  temporibus, incidunt fugit dolores enim.
                </DialogContent>
              </Dialog>
            </div>

            {teamspace.users.length > 0 ? (
              <div className="pt-4 flex flex-wrap -space-x-3">
                {teamspace.users.map((user) => (
                  <div
                    key={user.id}
                    className={`bg-primary w-10 h-10 rounded-full flex items-center justify-center font-semibold text-inverted text-lg`}
                  >
                    {user.full_name!.charAt(0)}
                  </div>
                ))}
                {teamspace.users.length > 4 && (
                  <div className="bg-background w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">
                    +{teamspace.users.length - 4}
                  </div>
                )}
              </div>
            ) : (
              <p>There are no members.</p>
            )}
          </div>
        </DialogTrigger>
        <DialogContent>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Autem eaque
          magni tenetur, optio commodi earum ipsa aperiam eligendi molestiae,
          debitis totam maxime error omnis rerum temporibus, incidunt fugit
          dolores enim.
        </DialogContent>
      </Dialog>
    </>
  );
};
