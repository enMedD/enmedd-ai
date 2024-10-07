/* "use client";

import { useState } from "react";
import Image from "next/image";
import { CustomModal } from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import { Teamspace } from "@/lib/types";
import { Plus, X } from "lucide-react";
import Logo from "../../../../../public/logo.png";
import { SearchInput } from "@/components/SearchInput";
import { DeleteModal } from "./DeleteModal";
import { Assistant } from "@/app/admin/assistants/interfaces";

interface TeamspaceAssistantProps {
  teamspace: Teamspace & { gradient: string };
  assistants: Assistant[];
}

interface AssistantContentProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredAssistants: Assistant[];
  isGlobal?: boolean;
  onAssistantClick?: (assistant: Assistant) => void;
}

const AssistantContent = ({
  searchTerm,
  setSearchTerm,
  filteredAssistants,
  isGlobal,
  onAssistantClick,
}: AssistantContentProps) => {
  return (
    <div className={isGlobal ? "cursor-pointer" : ""}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg leading-none tracking-tight lg:text-2xl font-semibold">
          {isGlobal ? "Global" : "Current"} Assistants
        </h2>
        <div className="w-1/2">
          <SearchInput
            placeholder="Search assistants..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filteredAssistants.map((assistant) => (
          <div
            key={assistant.id}
            className="border rounded-md flex cursor-pointer"
            onClick={() => onAssistantClick && onAssistantClick(assistant)}
          >
            <div className="rounded-l-md flex items-center justify-center p-4 border-r">
              <Image src={Logo} alt={assistant.name} width={150} height={150} />
            </div>
            <div className="w-full p-4">
              <div className="flex items-center justify-between w-full">
                <h3>{assistant.name}</h3>
                {!isGlobal && <DeleteModal type="Assistant" />}
                {isGlobal && (
                  <Button variant="ghost" size="smallIcon">
                    <Plus size={16} />
                  </Button>
                )}
              </div>
              <p className="text-sm pt-2 line-clamp">{assistant.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TeamspaceAssistant = ({
  teamspace,
  assistants,
}: TeamspaceAssistantProps) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [tempCurrentAssistants, setTempCurrentAssistants] = useState(
    teamspace.assistants
  );
  const [tempAvailableAssistants, setTempAvailableAssistants] = useState(
    assistants.filter(
      (assistant) =>
        assistant.is_public &&
        !teamspace.assistants.some((a) => a.id === assistant.id)
    )
  );

  const filteredCurrentAssistants = tempCurrentAssistants.filter((assistant) =>
    assistant.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAvailableAssistant = tempAvailableAssistants.filter(
    (assistant) =>
      assistant.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const moveAssistantToCurrent = (assistant: Assistant) => {
    setTempCurrentAssistants((prev) => [...prev, assistant]);
    setTempAvailableAssistants((prev) =>
      prev.filter((a) => a.id !== assistant.id)
    );
  };

  const handleSaveChanges = () => {
    console.log("Saving changes:", tempCurrentAssistants);
    // You can call an API or trigger a prop function here to save the state
  };

  return (
    <div className="relative">
      <CustomModal
        trigger={
          <Button
            className="absolute top-4 right-4"
            onClick={() => setIsInviteModalOpen(true)}
          >
            <Plus size={16} /> Add
          </Button>
        }
        title="Add new assistant"
        description="Your invite link has been created. Share this link to join your workspace."
        open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      >
        Add
      </CustomModal>

      <CustomModal
        trigger={
          <div
            className="rounded-md bg-muted w-full p-4 min-h-32 flex flex-col justify-between"
            onClick={() => setIsAssistantModalOpen(true)}
          >
            <h3>
              Assistant <span className="px-2 font-normal">|</span>{" "}
              {teamspace.assistants.length}
            </h3>
            {teamspace.assistants.length > 0 ? (
              <div className="pt-8 flex flex-wrap -space-x-3">
                {teamspace.assistants.slice(0, 8).map((teamspaceAssistant) => (
                  <div
                    key={teamspaceAssistant.id}
                    className={`bg-primary w-10 h-10 rounded-full flex items-center justify-center font-semibold text-inverted text-lg uppercase`}
                  >
                    {teamspaceAssistant.name!.charAt(0)}
                  </div>
                ))}
                {teamspace.assistants.length > 8 && (
                  <div className="bg-background w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">
                    +{teamspace.assistants.length - 8}
                  </div>
                )}
              </div>
            ) : (
              <p>There are no assistants.</p>
            )}
          </div>
        }
        title="Assistants"
        open={isAssistantModalOpen}
        onClose={() => setIsAssistantModalOpen(false)}
      >
        {tempCurrentAssistants.length > 0 ? (
          <div className="space-y-12">
            <AssistantContent
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredAssistants={filteredCurrentAssistants}
              onAssistantClick={moveAssistantToCurrent}
            />
            <AssistantContent
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredAssistants={filteredAvailableAssistant}
              isGlobal
              onAssistantClick={moveAssistantToCurrent}
            />
          </div>
        ) : (
          "There are no assistants."
        )}

        <div className="pt-20 pb-8 ml-auto">
          <Button onClick={handleSaveChanges}>Save changes</Button>
        </div>
      </CustomModal>
    </div>
  );
}; */
"use client";

import { useState } from "react";
import Image from "next/image";
import { CustomModal } from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import { Teamspace } from "@/lib/types";
import { Plus, X } from "lucide-react";
import Logo from "../../../../../public/logo.png";
import { SearchInput } from "@/components/SearchInput";
import { DeleteModal } from "./DeleteModal";
import { Assistant } from "@/app/admin/assistants/interfaces";
import { updateTeamspace } from "./[teamId]/lib";
import { TeamspaceUpdate } from "./types";

interface TeamspaceAssistantProps {
  teamspace: Teamspace & { gradient: string };
  assistants: Assistant[];
}

interface AssistantContentProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredAssistants: Assistant[];
  isGlobal?: boolean;
  onAssistantClick?: (assistant: Assistant) => void;
}

const AssistantContent = ({
  searchTerm,
  setSearchTerm,
  filteredAssistants,
  isGlobal,
  onAssistantClick,
}: AssistantContentProps) => {
  return (
    <div className={isGlobal ? "cursor-pointer" : ""}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg leading-none tracking-tight lg:text-2xl font-semibold">
          {isGlobal ? "Global" : "Current"} Assistants
        </h2>
        <div className="w-1/2">
          <SearchInput
            placeholder="Search assistants..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filteredAssistants.map((assistant) => (
          <div
            key={assistant.id}
            className="border rounded-md flex cursor-pointer"
            onClick={() => onAssistantClick && onAssistantClick(assistant)}
          >
            <div className="rounded-l-md flex items-center justify-center p-4 border-r">
              <Image src={Logo} alt={assistant.name} width={150} height={150} />
            </div>
            <div className="w-full p-4">
              <div className="flex items-center justify-between w-full">
                <h3>{assistant.name}</h3>
                {!isGlobal && <DeleteModal type="Assistant" />}
                {isGlobal && (
                  <Button variant="ghost" size="smallIcon">
                    <Plus size={16} />
                  </Button>
                )}
              </div>
              <p className="text-sm pt-2 line-clamp">{assistant.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TeamspaceAssistant = ({
  teamspace,
  assistants,
}: TeamspaceAssistantProps) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [tempCurrentAssistants, setTempCurrentAssistants] = useState(
    teamspace.assistants
  );
  const [tempAvailableAssistants, setTempAvailableAssistants] = useState(
    assistants.filter(
      (assistant) =>
        assistant.is_public &&
        !teamspace.assistants.some((a) => a.id === assistant.id)
    )
  );

  const filteredCurrentAssistants = tempCurrentAssistants.filter((assistant) =>
    assistant.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAvailableAssistant = tempAvailableAssistants.filter(
    (assistant) =>
      assistant.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const moveAssistantToCurrent = (assistant: Assistant) => {
    setTempCurrentAssistants((prev) => [...prev, assistant]);
    setTempAvailableAssistants((prev) =>
      prev.filter((a) => a.id !== assistant.id)
    );
  };

  /*   const handleSaveChanges = () => {
    console.log("Saving changes:", tempCurrentAssistants);
    // You can call an API or trigger a prop function here to save the state
  }; */
  const handleSaveChanges = async () => {
    // Convert assistant IDs to strings
    const userIds = tempCurrentAssistants.map((assistant) =>
      assistant.id.toString()
    );

    const teamspaceUpdate: TeamspaceUpdate = {
      user_ids: userIds,
      cc_pair_ids: [], // Include any relevant data if needed
    };

    try {
      await updateTeamspace(teamspace.id, teamspaceUpdate); // Assuming teamspace has an `id`
      console.log("Successfully updated teamspace assistants.");
      // Optionally refresh your data or handle success state
    } catch (error) {
      console.error("Error updating teamspace assistants:", error);
      // Handle error state
    }
  };

  return (
    <div className="relative">
      <CustomModal
        trigger={
          <Button
            className="absolute top-4 right-4"
            onClick={() => setIsInviteModalOpen(true)}
          >
            <Plus size={16} /> Add
          </Button>
        }
        title="Add new assistant"
        description="Your invite link has been created. Share this link to join your workspace."
        open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      >
        Add
      </CustomModal>

      <CustomModal
        trigger={
          <div
            className="rounded-md bg-muted w-full p-4 min-h-32 flex flex-col justify-between"
            onClick={() => setIsAssistantModalOpen(true)}
          >
            <h3>
              Assistant <span className="px-2 font-normal">|</span>{" "}
              {teamspace.assistants.length}
            </h3>
            {teamspace.assistants.length > 0 ? (
              <div className="pt-8 flex flex-wrap -space-x-3">
                {teamspace.assistants.slice(0, 8).map((teamspaceAssistant) => (
                  <div
                    key={teamspaceAssistant.id}
                    className={`bg-primary w-10 h-10 rounded-full flex items-center justify-center font-semibold text-inverted text-lg uppercase`}
                  >
                    {teamspaceAssistant.name!.charAt(0)}
                  </div>
                ))}
                {teamspace.assistants.length > 8 && (
                  <div className="bg-background w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">
                    +{teamspace.assistants.length - 8}
                  </div>
                )}
              </div>
            ) : (
              <p>There are no assistants.</p>
            )}
          </div>
        }
        title="Assistants"
        open={isAssistantModalOpen}
        onClose={() => setIsAssistantModalOpen(false)}
      >
        {tempCurrentAssistants.length > 0 ? (
          <div className="space-y-12">
            <AssistantContent
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredAssistants={filteredCurrentAssistants}
              onAssistantClick={moveAssistantToCurrent}
            />
            <AssistantContent
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredAssistants={filteredAvailableAssistant}
              isGlobal
              onAssistantClick={moveAssistantToCurrent}
            />
          </div>
        ) : (
          "There are no assistants."
        )}

        <div className="pt-20 pb-8 ml-auto">
          <Button onClick={handleSaveChanges}>Save changes</Button>
        </div>
      </CustomModal>
    </div>
  );
};
