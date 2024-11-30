"use client";

import { useEffect, useState } from "react";
import { buildImgUrl } from "@/app/chat/files/images/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGradient } from "@/hooks/useGradient";
import { Teamspace } from "@/lib/types";
import { Users } from "lucide-react";
import { CustomModal } from "@/components/CustomModal";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ThreeDotsLoader } from "@/components/Loading";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useUserTeamspaces } from "@/lib/hooks";

export default function UserTeamspace() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeamspace, setSelectedTeamspace] = useState<any>(null);

  const { data: teamspaces, isLoading } = useUserTeamspaces();

  if (isLoading) {
    return <ThreeDotsLoader />;
  }

  const filteredTeamspaces = teamspaces?.filter((teamspace) =>
    teamspace.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteTeamspace = async (teamspaceId: number) => {
    try {
      const response = await fetch(`/api/teamspace/leave/${teamspaceId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      setIsModalOpen(false);

      router.refresh();
      if (response.ok) {
        toast({
          title: "Teamspace Left",
          description: "You have successfully left the teamspace.",
          variant: "success",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to leave teamspace",
          description: `Error: ${errorData.detail}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "An Error Occurred",
        description:
          "An unexpected error occurred while leaving the teamspace.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <CustomModal
        trigger={null}
        title="Leave Team?"
        description={`Are you sure you want to leave the team '${selectedTeamspace?.name}'? This action cannot be undone.`}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              selectedTeamspace && deleteTeamspace(selectedTeamspace.id)
            }
          >
            Leave
          </Button>{" "}
        </div>
      </CustomModal>
      <div className="py-8 w-full">
        <h2 className="font-bold text-lg md:text-xl">Your Teamspaces</h2>
        <p className="text-sm">
          Manage and explore all the teamspaces you&apos;re part of. Search,
          view details, or leave a teamspace with ease.
        </p>

        <div className="flex flex-col gap-6 pt-8">
          <div className="relative w-full md:w-1/2 ml-auto">
            <Input
              type="text"
              placeholder="Search Teamspace"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-6">
            {filteredTeamspaces?.map((teamspace) => (
              <Card
                key={teamspace.id}
                className="w-full h-[280px] sm:w-[calc(50%_-_14px)] xl:w-[calc(33%_-_12.5px)]"
              >
                <CardContent className="h-full">
                  <div className="space-y-5 text-sm flex flex-col justify-between h-full">
                    <div className="flex justify-between gap-5 items-end">
                      <div className="w-full max-w-64">
                        <h3 className="text-lg text-strong truncate !font-bold">
                          {teamspace.name}
                        </h3>
                        <div className="flex items-center gap-1 text-subtle">
                          <p className="space-x-2 flex gap-2 items-center">
                            <Users size={16} />
                            {teamspace.users.length} people
                          </p>
                          |
                          <Badge
                            variant={
                              teamspace.users.find(
                                (user) => user.role === "basic"
                              )
                                ? "secondary"
                                : "paused"
                            }
                          >
                            {teamspace.users.find(
                              (user) => user.role === "basic"
                            )
                              ? "User"
                              : "Admin"}
                          </Badge>
                        </div>
                      </div>
                      <div className="relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                        {teamspace.logo ? (
                          <img
                            src={buildImgUrl(teamspace.logo)}
                            alt="Teamspace Logo"
                            className="object-cover w-full h-full"
                            width={40}
                            height={40}
                          />
                        ) : (
                          <div
                            style={{ background: useGradient(teamspace.name) }}
                            className="font-bold text-2xl text-inverted  bg-brand-500 flex justify-center items-center uppercase w-full h-full"
                          >
                            {teamspace.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="space-x-2 flex gap-2 items-center text-subtle">
                      <Users size={16} />
                      {teamspace.users.length}
                    </p>
                    <p className="text-subtle">
                      Role:{" "}
                      <span className="text-strong">
                        {teamspace.users.find((user) => user.role === "basic")
                          ? "Basic"
                          : "Admin"}
                      </span>
                    </p>

                    <p className="line-clamp h-[78px] break-all text-subtle">
                      {teamspace.description
                        ? teamspace.description
                        : "No description"}
                    </p>

                    <div className="flex justify-end pt-2">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedTeamspace(teamspace);
                          setIsModalOpen(true);
                        }}
                      >
                        Leave
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
