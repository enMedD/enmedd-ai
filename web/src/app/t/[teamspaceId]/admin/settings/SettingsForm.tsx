"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cog, ChartNoAxesColumnIncreasing, User } from "lucide-react";
import General from "./TabContent/General";
import Usage from "./TabContent/Usage";
import { Configuration } from "./TabContent/Configuration";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function SettingsForm() {
  const { teamspaceId } = useParams();
  const { toast } = useToast();
  const [teamspaceName, setTeamspaceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  return (
    <div>
      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <User size={16} /> General
          </TabsTrigger>
          <TabsTrigger
            value="configuration"
            className="flex items-center gap-2"
          >
            <Cog size={16} /> Configuration
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <ChartNoAxesColumnIncreasing size={16} className="rotate-90" />{" "}
            Usage
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="w-full">
          <General
            onChange={(name) => setTeamspaceName(name)}
            teamspaceId={teamspaceId}
            teamspaceName={teamspaceName}
            isEditing={isEditing}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="configuration">
          <Configuration />
        </TabsContent>
        <TabsContent value="usage">
          <Usage />
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 py-8 justify-end">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              className="border-destructive-foreground hover:bg-destructive-foreground"
              onClick={() => setIsEditing(false)}
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
