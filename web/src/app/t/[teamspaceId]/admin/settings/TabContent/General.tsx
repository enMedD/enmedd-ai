import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface GeneralProps {
  teamspaceId: string | string[];
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
}

export default function General({
  teamspaceId,
  isEditing,
  setIsEditing,
}: GeneralProps) {
  const { toast } = useToast();
  const [teamspaceName, setTeamspaceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamspaceData = async () => {
      try {
        const [teamspaceResponse, logoResponse] = await Promise.all([
          fetch(`/api/manage/admin/teamspace/${teamspaceId}`),
          fetch(`/api/teamspace/logo?teamspace_id=${teamspaceId}`),
        ]);

        if (teamspaceResponse.ok) {
          const { name } = await teamspaceResponse.json();
          setTeamspaceName(name);
        } else {
          console.error("Failed to fetch teamspace data");
        }

        if (logoResponse.ok) {
          const blob = await logoResponse.blob();
          const logoUrl = URL.createObjectURL(blob);
          setProfileImageUrl(logoUrl);
        } else {
          console.error("Failed to fetch teamspace logo");
        }
      } catch (error) {
        console.error("Error fetching teamspace information:", error);
      }
    };

    fetchTeamspaceData();
  }, [teamspaceId]);

  const handleUpdate = async () => {
    setIsLoading(true);

    try {
      // Update teamspace name
      const updateResponse = await fetch(
        `/api/manage/admin/teamspace?teamspace_id=${teamspaceId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: teamspaceName }),
        }
      );

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        showToast(
          "Update Failed",
          error.detail || "Failed to update teamspace.",
          "destructive"
        );
        return;
      }

      // Upload logo if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch(
          `/api/manage/admin/teamspace/logo?teamspace_id=${teamspaceId}`,
          { method: "PUT", body: formData }
        );

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          showToast("Logo Upload Failed", error.detail, "destructive");
          return;
        }
      }

      showToast("Success", "Teamspace updated successfully.", "success");
      setIsEditing(false);
    } catch (error) {
      showToast("Error", "An error occurred. Please try again.", "destructive");
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (
    title: string,
    description: string,
    variant: "success" | "destructive"
  ) => {
    toast({ title, description, variant });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTeamspaceName(e.target.value);
  };

  const handleLogoUpload = () => {
    setIsEditing(true);
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) setSelectedFile(file);
    };
    fileInput.click();
  };

  const handleRemoveLogo = async () => {
    try {
      const response = await fetch("/api/me/profile", { method: "DELETE" });
      if (response.ok) {
        setProfileImageUrl(null);
        showToast("Success", "Logo removed successfully.", "success");
      } else {
        const error = await response.json();
        showToast("Removal Failed", error.detail, "destructive");
      }
    } catch (error) {
      showToast("Error", "An error occurred. Please try again.", "destructive");
    }
  };

  return (
    <div className="mt-8 w-full">
      <Header
        title="General Information"
        subtitle="Update your teamspace name and logo."
      />

      <Section title="Teamspace Name" isEditing>
        {isEditing ? (
          <Input
            placeholder="Enter Teamspace Name"
            value={teamspaceName}
            onChange={handleInputChange}
          />
        ) : teamspaceName ? (
          <h3 className="truncate">{teamspaceName}</h3>
        ) : (
          <Skeleton className="w-full h-8 rounded-md" />
        )}
      </Section>

      <Section
        title="Teamspace Logo"
        description="Update your company logo and choose where to display it."
      >
        <div className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={handleLogoUpload}
            className="h-16 w-16 rounded-full overflow-hidden"
          >
            {selectedFile ? (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Selected Logo"
              />
            ) : profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="Current Logo"
                className="object-cover w-full h-full"
              />
            ) : (
              <Skeleton className="w-16 h-16 rounded-full" />
            )}
          </div>

          {isEditing && selectedFile && (
            <Button
              variant="link"
              className="text-destructive"
              onClick={handleRemoveLogo}
            >
              Remove
            </Button>
          )}
        </div>
      </Section>

      <div className="flex justify-end gap-2 py-8">
        {isEditing ? (
          <>
            <Button
              variant="outline"
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

const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div>
    <h2 className="font-bold text-lg md:text-xl">{title}</h2>
    {subtitle && <p className="text-sm">{subtitle}</p>}
  </div>
);

const Section = ({
  title,
  description,
  children,
  isEditing,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  isEditing?: boolean;
}) => (
  <div className="flex py-8 border-b gap-5">
    <div className="w-44 sm:w-80 xl:w-[500px] shrink-0">
      <h3>{title}</h3>
      {description && <p className="pt-1 text-sm">{description}</p>}
    </div>
    <div className={`flex-grow min-h-10 ${isEditing ? "" : "truncate"}`}>
      {children}
    </div>
  </div>
);
