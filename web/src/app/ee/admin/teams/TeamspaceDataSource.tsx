"use client";

import { CustomModal } from "@/components/CustomModal";
import { SearchInput } from "@/components/SearchInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CCPairDescriptor,
  ConnectorIndexingStatus,
  Teamspace,
} from "@/lib/types";
import { Checkbox } from "@radix-ui/react-checkbox";
import { BookmarkIcon, Copy, Globe, Plus } from "lucide-react";
import { useState } from "react";
import { DeleteModal } from "./DeleteModal";
import { useConnectorCredentialIndexingStatus } from "@/lib/hooks";

interface TeamspaceDataSourceProps {
  teamspace: Teamspace & { gradient: string };
}

interface DataSourceProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredDataSources:
    | ConnectorIndexingStatus<any, any>[]
    | CCPairDescriptor<any, any>[]
    | undefined;
  isGlobal?: boolean;
}

const DataSourceContent = ({
  searchTerm,
  setSearchTerm,
  filteredDataSources,
  isGlobal,
}: DataSourceProps) => {
  return (
    <div className={isGlobal ? "cursor-pointer" : ""}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg leading-none tracking-tight lg:text-xl font-semibold">
          {isGlobal ? "Available" : "Current"} Data Source
        </h2>
        <div className="w-1/2 ml-auto mb-4">
          <SearchInput
            placeholder="Search document sets..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {filteredDataSources?.map((document, i) => (
          <div
            key={i}
            className="border rounded-md p-4 gap-4 flex items-center"
          >
            <Globe className="shrink-0 my-auto" />
            <h3 className="truncate">{document.name}</h3>
            {!isGlobal ? (
              <DeleteModal type="Data Source" />
            ) : (
              <Button variant="ghost" size="smallIcon" className="ml-auto">
                <Plus size={16} className="shrink-0" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const TeamspaceDataSource = ({
  teamspace,
}: TeamspaceDataSourceProps) => {
  const {
    data: ccPairs,
    isLoading: isCCPairsLoading,
    error: ccPairsError,
  } = useConnectorCredentialIndexingStatus();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDataSourceModalOpen, setIsDataSourceModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCurrentCCPairs = teamspace.cc_pairs.filter((cc_pair) =>
    cc_pair.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGlobalCCPairs = ccPairs?.filter((ccPair) =>
    ccPair.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        title="Add new data source."
        description="Your invite link has been created. Share this link to join
            your workspace."
        open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      >
        Add
      </CustomModal>
      <CustomModal
        trigger={
          <div
            className="rounded-md bg-muted w-full p-4 min-h-32 flex flex-col justify-between"
            onClick={() => setIsDataSourceModalOpen(true)}
          >
            <h3>
              Data Source <span className="px-2 font-normal">|</span>{" "}
              {teamspace.cc_pairs.length}
            </h3>

            {teamspace.cc_pairs.length > 0 ? (
              <div className="pt-8 flex flex-wrap gap-2">
                {teamspace.cc_pairs.map((cc_pair) => {
                  return (
                    <Badge
                      key={cc_pair.id}
                      className="truncate whitespace-nowrap"
                    >
                      <BookmarkIcon size={16} className="shrink-0" />
                      <span className="truncate">{cc_pair.name}</span>
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <p>There are data source.</p>
            )}
          </div>
        }
        title="Data Sources"
        open={isDataSourceModalOpen}
        onClose={() => setIsDataSourceModalOpen(false)}
      >
        {teamspace.cc_pairs.length > 0 ? (
          <div className="space-y-12">
            <DataSourceContent
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredDataSources={filteredCurrentCCPairs}
            />
            <DataSourceContent
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredDataSources={filteredGlobalCCPairs}
              isGlobal
            />
          </div>
        ) : (
          "There are no data source"
        )}
      </CustomModal>
    </div>
  );
};
