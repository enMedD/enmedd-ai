/* import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Logo from "../../../../../../../public/logo.png";
import { Skeleton } from "@/components/ui/skeleton";

export default function General({
  onChange,
  teamspaceId,
  teamspaceName,
  isEditing,
  isLoading,
}: {
  onChange: (name: string) => void;
  teamspaceId: string | string[];
  teamspaceName: string;
  isEditing: boolean;
  isLoading: boolean;
}) {
  const [localTeamspaceName, setLocalTeamspaceName] = useState("");

  useEffect(() => {
    async function fetchTeamspace() {
      try {
        const response = await fetch(
          `/api/manage/admin/teamspace/${teamspaceId}?teamspace_id=${teamspaceId}`
        );
        const data = await response.json();
        setLocalTeamspaceName(data.name);
      } catch (error) {
        console.error("Error fetching teamspace data:", error);
      }
    }

    fetchTeamspace();
  }, [teamspaceId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTeamspaceName(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div className="mt-8 w-full">
      <div>
        <h2 className="font-bold text-lg md:text-xl">General Information</h2>
        <p className="text-sm">Update your teamspace name and logo.</p>
      </div>

      <div className="w-full">
        <div className="flex items-center py-8 border-b gap-5">
          <div className="w-44 sm:w-80 xl:w-[500px] shrink-0">
            <h3>Teamspace Name</h3>
            <p className="pt-1 text-sm">
              This will be displayed on your profile.
            </p>
          </div>
          <div
            className={`md:w-[500px] h-10 flex items-center justify-between ${isEditing ? "" : "truncate"}`}
          >
            {isEditing ? (
              <Input
                placeholder="Enter Teamspace Name"
                value={localTeamspaceName}
                onChange={handleInputChange}
              />
            ) : (
              <>
                {isLoading ? (
                  <Skeleton className="w-full h-8 rounded-md" />
                ) : (
                  <span className="font-semibold text-inverted-inverted w-full truncate">
                    {teamspaceName || localTeamspaceName}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center py-8 border-b gap-5">
          <div className="w-44 sm:w-80 xl:w-[500px] shrink-0">
            <h3>Teamspace Logo</h3>
            <p className="pt-1 text-sm w-44 sm:w-80">
              Update your company logo and select where you want it to be
              displayed.
            </p>
          </div>
          <div className="shrink-0">
            <Image src={Logo} alt="Logo" />
          </div>
        </div>
      </div>
    </div>
  );
}*/

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Logo from "../../../../../../../public/logo.png";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function General({
  teamspaceId,
  isEditing,
  setIsEditing,
}: {
  teamspaceId: string | string[];
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
}) {
  const [localTeamspaceName, setLocalTeamspaceName] = useState("");
  const { toast } = useToast();
  const [teamspaceName, setTeamspaceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/manage/admin/teamspace?teamspace_id=${teamspaceId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: teamspaceName }),
        }
      );

      if (response.ok) {
        setIsEditing(false);
        toast({
          title: "Teamspace Updated",
          description: "Teamspace name updated successfully!",
          variant: "success",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Update Failed",
          description: data.detail || "Failed to update teamspace name.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "An Error Occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function fetchTeamspace() {
      try {
        const response = await fetch(
          `/api/manage/admin/teamspace/${teamspaceId}?teamspace_id=${teamspaceId}`
        );
        const data = await response.json();
        setLocalTeamspaceName(data.name);
      } catch (error) {
        console.error("Error fetching teamspace data:", error);
      }
    }

    fetchTeamspace();
  }, [teamspaceId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTeamspaceName(e.target.value);
    setTeamspaceName(e.target.value);
  };

  return (
    <div className="mt-8 w-full">
      <div>
        <h2 className="font-bold text-lg md:text-xl">General Information</h2>
        <p className="text-sm">Update your teamspace name and logo.</p>
      </div>

      <div className="w-full">
        <div className="flex items-center py-8 border-b gap-5">
          <div className="w-44 sm:w-80 xl:w-[500px] shrink-0">
            <h3>Teamspace Name</h3>
            <p className="pt-1 text-sm">
              This will be displayed on your profile.
            </p>
          </div>
          <div
            className={`md:w-[500px] h-10 flex items-center justify-between ${isEditing ? "" : "truncate"}`}
          >
            {isEditing ? (
              <Input
                placeholder="Enter Teamspace Name"
                value={localTeamspaceName}
                onChange={handleInputChange}
              />
            ) : (
              <>
                {isLoading ? (
                  <Skeleton className="w-full h-8 rounded-md" />
                ) : (
                  <span className="font-semibold text-inverted-inverted w-full truncate">
                    {teamspaceName || localTeamspaceName}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center py-8 border-b gap-5">
          <div className="w-44 sm:w-80 xl:w-[500px] shrink-0">
            <h3>Teamspace Logo</h3>
            <p className="pt-1 text-sm w-44 sm:w-80">
              Update your company logo and select where you want it to be
              displayed.
            </p>
          </div>
          <div className="shrink-0">
            <Image src={Logo} alt="Logo" />
          </div>
        </div>
      </div>

      <div className="flex gap-2 py-8 justify-end">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              className="border-destructive-foreground hover:bg-destructive-foreground"
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              Save Changes
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}
