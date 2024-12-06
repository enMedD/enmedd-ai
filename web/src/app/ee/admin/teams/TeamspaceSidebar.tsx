"use client";

import useSWR from "swr";
import { Dispatch, SetStateAction, useState } from "react";
import { useGradient } from "@/hooks/useGradient";
import { SidebarContent } from "@/components/ui/sidebar";
import { ConnectorIndexingStatus, DocumentSet, Teamspace } from "@/lib/types";
import { Assistant } from "@/app/admin/assistants/interfaces";
import { Check, Pen, Shield, X } from "lucide-react";
import { errorHandlingFetcher } from "@/lib/fetcher";
import { buildImgUrl } from "@/app/chat/files/images/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TeamspaceMember } from "./TeamspaceMember";
import { TeamspaceAssistant } from "./TeamspaceAssistant";
import { TeamspaceDocumentSet } from "./TeamspaceDocumentSet";
import { TeamspaceDataSource } from "./TeamspaceDataSource";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface TeamspaceSidebarProps {
  selectedTeamspace?: Teamspace;
  assistants: Assistant[];
  ccPairs: ConnectorIndexingStatus<any, any>[];
  documentSets: DocumentSet[];
  refreshTeamspaces: () => void;
  isEditingName: boolean;
  isEditingDescription: boolean;
  setIsEditingName: Dispatch<SetStateAction<boolean>>;
  setIsEditingDescription: Dispatch<SetStateAction<boolean>>;
}

export const TeamspaceSidebar = ({
  selectedTeamspace,
  assistants,
  ccPairs,
  documentSets,
  refreshTeamspaces,
  isEditingName,
  isEditingDescription,
  setIsEditingName,
  setIsEditingDescription,
}: TeamspaceSidebarProps) => {
  const [isNameHovered, setIsNameHovered] = useState(false);
  const [isDescriptionHovered, setIsDescriptionHovered] = useState(false);
  const [tempDescription, setTempDescription] = useState<string | null>(null);
  const [tempName, setTempName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const { data, error } = useSWR(
    selectedTeamspace
      ? `/api/admin/token-rate-limits/teamspace/${selectedTeamspace.id}`
      : null,
    errorHandlingFetcher
  );

  const tokenRate = data && data.length > 0 ? data[0] : null;

  const handleSaveDescription = async () => {
    if (!selectedTeamspace || tempDescription === null) return;

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/manage/admin/teamspace?teamspace_id=${selectedTeamspace.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: selectedTeamspace.name,
            description: tempDescription,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update the teamspace description");
      }

      selectedTeamspace.description = tempDescription;
      setIsEditingDescription(false);
      setIsDescriptionHovered(false);
      setTempDescription(null);
      refreshTeamspaces();

      toast({
        title: "Description Updated",
        description: `The description for "${selectedTeamspace.name}" has been updated successfully.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating teamspace description:", error);

      toast({
        title: "Update Failed",
        description:
          "An error occurred while updating the description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveName = async () => {
    if (!selectedTeamspace || !tempName?.trim()) return;

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/manage/admin/teamspace?teamspace_id=${selectedTeamspace.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: tempName,
            description: selectedTeamspace.description,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update the teamspace name");
      }

      selectedTeamspace.name = tempName;
      setIsEditingName(false);
      setIsNameHovered(false);
      setTempName(null);
      refreshTeamspaces();

      toast({
        title: "Name Updated",
        description: `The name for "${tempName}" has been updated successfully.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating teamspace name:", error);

      toast({
        title: "Update Failed",
        description:
          "An error occurred while updating the teamspace name. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const startEditingDescription = () => {
    setTempDescription(selectedTeamspace?.description || "");
    setIsEditingDescription(true);
  };

  const cancelEditingDescription = () => {
    setTempDescription(null);
    setIsEditingDescription(false);
    setIsDescriptionHovered(false);
  };

  const startEditingName = () => {
    setTempName(selectedTeamspace?.name || "");
    setIsEditingName(true);
  };

  const cancelEditingName = () => {
    setTempName(null);
    setIsEditingName(false);
    setIsNameHovered(false);
  };

  return (
    <SidebarContent>
      {selectedTeamspace && (
        <>
          <div
            style={{ background: useGradient(selectedTeamspace.name) }}
            className="h-40 relative shrink-0"
          >
            <div className="absolute top-full -translate-y-1/2 left-1/2 -translate-x-1/2">
              {selectedTeamspace.logo ? (
                <div className="rounded-md w-16 h-16 bg-background overflow-hidden shrink-0">
                  <img
                    src={buildImgUrl(selectedTeamspace.logo)}
                    alt="Teamspace Logo"
                    className="object-cover w-full h-full"
                    width={40}
                    height={40}
                  />
                </div>
              ) : (
                <span
                  style={{ background: useGradient(selectedTeamspace.name) }}
                  className="text-3xl uppercase font-bold min-w-16 min-h-16 flex items-center justify-center rounded-xl text-inverted border-[5px] border-inverted shrink-0"
                >
                  {selectedTeamspace.name.charAt(0)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center px-6 py-14 w-full">
            <div className="flex flex-col items-center gap-2 w-full">
              <div
                className={`relative ${isEditingName ? "w-full" : "w-fit"}`}
                onMouseEnter={() => setIsNameHovered(true)}
                onMouseLeave={() => setIsNameHovered(false)}
              >
                <h1 className="text-center font-bold text-xl md:text-[28px] w-full px-4 flex justify-center">
                  {isEditingName ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={tempName || ""}
                        onChange={(e) => setTempName(e.target.value)}
                        className="text-base font-normal"
                        placeholder="Set a name"
                      />
                      <Button
                        size="smallIcon"
                        variant="destructive"
                        onClick={cancelEditingName}
                        disabled={isSaving}
                      >
                        <X size={14} />
                      </Button>
                      <Button
                        size="smallIcon"
                        onClick={handleSaveName}
                        disabled={
                          isSaving || tempName === selectedTeamspace?.name
                        }
                      >
                        <Check size={14} />
                      </Button>
                    </div>
                  ) : (
                    <p
                      onClick={startEditingName}
                      className="cursor-pointer truncate max-w-[300px]"
                    >
                      {selectedTeamspace.name}
                    </p>
                  )}
                </h1>
                {isNameHovered && !isEditingName && (
                  <Button
                    size="smallIcon"
                    className="absolute bottom-full right-0"
                    onClick={startEditingName}
                  >
                    <Pen size={14} />
                  </Button>
                )}
              </div>

              <div
                className={`relative ${
                  isEditingDescription ? "w-full" : "w-fit"
                }`}
                onMouseEnter={() => setIsDescriptionHovered(true)}
                onMouseLeave={() => setIsDescriptionHovered(false)}
              >
                {isEditingDescription ? (
                  <div className="relative">
                    <Textarea
                      className="min-h-20 max-h-40"
                      value={tempDescription || ""}
                      onChange={(e) => setTempDescription(e.target.value)}
                      placeholder="Set a description"
                    />
                    <div className="absolute bottom-2 right-2 flex space-x-1">
                      <Button
                        size="smallIcon"
                        variant="destructive"
                        onClick={cancelEditingDescription}
                        disabled={isSaving}
                      >
                        <X size={14} />
                      </Button>
                      <Button
                        size="smallIcon"
                        onClick={handleSaveDescription}
                        disabled={
                          isSaving ||
                          tempDescription === selectedTeamspace?.description
                        }
                      >
                        <Check size={14} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {selectedTeamspace.description ? (
                      <p
                        className="line-clamp text-sm text-center px-4 break-all cursor-pointer"
                        onClick={startEditingDescription}
                      >
                        {selectedTeamspace.description}
                      </p>
                    ) : (
                      <p>No description</p>
                    )}
                  </>
                )}

                {isDescriptionHovered && !isEditingDescription && (
                  <Button
                    size="smallIcon"
                    className="absolute bottom-full right-0"
                    onClick={startEditingDescription}
                  >
                    <Pen size={14} />
                  </Button>
                )}
              </div>
              <span className="text-center text-primary pt-1 font-medium text-sm">
                {selectedTeamspace.creator.full_name}
              </span>
              <span className="text-center pt-4 font-bold text-sm flex items-center gap-1">
                <Shield size={16} />
                {tokenRate
                  ? `${tokenRate.token_budget} Token Rate`
                  : "No Token Rate"}
              </span>
            </div>

            <div className="w-full flex flex-col gap-4 pt-14">
              <TeamspaceMember
                teamspace={{
                  ...selectedTeamspace,
                  gradient: useGradient(selectedTeamspace.name),
                }}
                refreshTeamspaces={refreshTeamspaces}
              />
              <TeamspaceAssistant
                teamspace={{
                  ...selectedTeamspace,
                  gradient: useGradient(selectedTeamspace.name),
                }}
                assistants={assistants}
                refreshTeamspaces={refreshTeamspaces}
              />
              <TeamspaceDocumentSet
                teamspace={{
                  ...selectedTeamspace,
                  gradient: useGradient(selectedTeamspace.name),
                }}
                documentSets={documentSets}
                refreshTeamspaces={refreshTeamspaces}
              />
              <TeamspaceDataSource
                teamspace={{
                  ...selectedTeamspace,
                  gradient: useGradient(selectedTeamspace.name),
                }}
                ccPairs={ccPairs}
                refreshTeamspaces={refreshTeamspaces}
              />
            </div>
          </div>
        </>
      )}
    </SidebarContent>
  );
};
