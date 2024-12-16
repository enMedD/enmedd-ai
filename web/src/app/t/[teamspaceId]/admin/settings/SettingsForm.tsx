"use client";

import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cog, User } from "lucide-react";
import Usage from "./TabContent/Usage";
import { useParams } from "next/navigation";
import { useState } from "react";
const General = dynamic(() => import("./TabContent/General"));
const Configuration = dynamic(() => import("./TabContent/Configuration"));

export function SettingsForm() {
  const { teamspaceId } = useParams();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div>
      <Tabs
        defaultValue="general"
        className="w-full"
        onValueChange={() => setIsEditing(false)}
      >
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
        </TabsList>
        <TabsContent value="general" className="w-full">
          <General
            teamspaceId={teamspaceId}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
        </TabsContent>
        <TabsContent value="configuration">
          <Configuration />
        </TabsContent>
        <TabsContent value="usage">
          <Usage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
