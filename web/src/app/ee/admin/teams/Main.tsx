"use client";

import { TeamspacesTable } from "./TeamspacesTable";
import { TeamspaceCreationForm } from "./TeamspaceCreationForm";
import { useState } from "react";
import { ThreeDotsLoader } from "@/components/Loading";
import {
  useConnectorCredentialIndexingStatus,
  useTeamspaces,
  useUsers,
} from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { CustomModal } from "@/components/CustomModal";
import { Assistant } from "@/app/admin/assistants/interfaces";
import { Book, Bookmark, Cpu, Plus, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FiBook } from "react-icons/fi";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TeamspacesCard } from "./TeamspacesCard";

export const Main = ({ assistants }: { assistants: Assistant[] }) => {
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, error, refreshTeamspaces } = useTeamspaces();

  const {
    data: ccPairs,
    isLoading: isCCPairsLoading,
    error: ccPairsError,
  } = useConnectorCredentialIndexingStatus();

  const {
    data: users,
    isLoading: userIsLoading,
    error: usersError,
  } = useUsers();

  if (isLoading || isCCPairsLoading || userIsLoading) {
    return <ThreeDotsLoader />;
  }

  if (error || !data) {
    return <div className="text-red-600">Error loading users</div>;
  }

  if (ccPairsError || !ccPairs) {
    return <div className="text-red-600">Error loading connectors</div>;
  }

  if (usersError || !users) {
    return <div className="text-red-600">Error loading users</div>;
  }

  return (
    <div>
      <div className="pb-20">
        <div className="flex justify-between items-center pb-10">
          <h1 className="font-bold text-xl md:text-[28px]">Team Space</h1>
          <CustomModal
            trigger={
              <Button onClick={() => setShowForm(true)}>
                <div className="flex items-center">
                  <Users size={20} />
                  <Plus size={12} className="-ml-0.5" strokeWidth={4} />
                </div>
                Create team
              </Button>
            }
            onClose={() => setShowForm(false)}
            open={showForm}
            title="Create a new Teamspace"
          >
            <TeamspaceCreationForm
              onClose={() => {
                refreshTeamspaces();
                setShowForm(false);
              }}
              users={users.accepted}
              ccPairs={ccPairs}
              assistants={assistants}
            />
          </CustomModal>
        </div>

        <div className="flex gap-6">
          <Input placeholder="Type a commard or search..." />
          <Select>
            <SelectTrigger className="w-full lg:w-64">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1"></SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <TeamspacesCard teamspaces={data} refresh={refreshTeamspaces} />

      {data.length > 0 && (
        <div className="pt-5">
          <TeamspacesTable teamspaces={data} refresh={refreshTeamspaces} />
        </div>
      )}
    </div>
  );
};
