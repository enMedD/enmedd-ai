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

export default function UserTeamspace() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [teamspaces, setTeamspaces] = useState<Teamspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeamspace, setSelectedTeamspace] = useState<any>(null);

  useEffect(() => {
    const fetchTeamspaces = async () => {
      try {
        const response = await fetch("/api/teamspace/user-list", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        setLoading(true);

        if (response.ok) {
          const data = await response.json();
          setTeamspaces(data);
        } else {
          const errorData = await response.json();
          console.log(errorData);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamspaces();
  }, []);

  const filteredTeamspaces = teamspaces.filter((teamspace) =>
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

  if (loading) {
    return <ThreeDotsLoader />;
  }

  return (
    <>
      <CustomModal
        trigger={null}
        title="Leave Team?"
        description={`Are you sure you want to leave the team '${selectedTeamspace?.name}'? This action cannot be undone.`} // Use selectedTeamspace
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

          <div className="flex flex-wrap gap-8">
            {filteredTeamspaces?.map((teamspace) => (
              <Card
                key={teamspace.id}
                className="w-full sm:w-[calc(50%_-_16px)] xl:w-[calc(33%_-_18px)]"
              >
                <CardContent>
                  <div>
                    <div className="flex justify-between gap-5 items-end">
                      <h3 className="text-2xl text-strong truncate">
                        {teamspace.name}
                      </h3>
                      <div className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                        {teamspace.logo ? (
                          <Image
                            src={buildImgUrl(teamspace.logo)}
                            alt="Teamspace Logo"
                            className="object-cover w-full h-full"
                            width={40}
                            height={40}
                          />
                        ) : (
                          <div
                            style={{ background: useGradient(teamspace.name) }}
                            className="font-bold text-3xl text-inverted  bg-brand-500 flex justify-center items-center uppercase w-full h-full"
                          >
                            {teamspace.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="space-x-2 flex gap-2 items-center text-subtle">
                      <Users size={15} />
                      {teamspace.users.length}
                    </p>
                    <p>
                      Role:{" "}
                      {teamspace.users.find((user) => user.role === "basic")
                        ? "Basic"
                        : "Admin"}
                    </p>

                    <div className="flex justify-end pt-8">
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
