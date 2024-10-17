import { useEffect, useState } from "react";
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
          <div className="md:w-[500px] h-10 flex items-center justify-between truncate">
            {isEditing ? (
              <Input
                placeholder="Enter Teamspace Name"
                value={localTeamspaceName}
                onChange={handleInputChange}
              />
            ) : (
              <>
                {!localTeamspaceName ? (
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
}
