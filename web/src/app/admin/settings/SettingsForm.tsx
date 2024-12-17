"use client";

import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cog, User } from "lucide-react";
import { FeatureFlagWrapper } from "@/components/feature_flag/FeatureFlagWrapper";
const General = dynamic(() => import("./TabContent/General"));
const Configuration = dynamic(() => import("./TabContent/Configuration"));

export function SettingsForm() {
  return (
    <div>
      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <FeatureFlagWrapper flag="whitelabelling">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <User size={16} /> General
            </TabsTrigger>
          </FeatureFlagWrapper>
          <TabsTrigger
            value="configuration"
            className="flex items-center gap-2"
          >
            <Cog size={16} /> Configuration
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="w-full">
          <General />
        </TabsContent>
        <TabsContent value="configuration">
          <Configuration />
        </TabsContent>
      </Tabs>
    </div>
  );
}
