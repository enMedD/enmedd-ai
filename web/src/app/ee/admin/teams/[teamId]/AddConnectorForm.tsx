import { SearchMultiSelectDropdown } from "@/components/Dropdown";
import { useState } from "react";
import { updateTeamspace } from "./lib";
import { ConnectorIndexingStatus, Teamspace } from "@/lib/types";
import { ConnectorTitle } from "@/components/admin/connectors/ConnectorTitle";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Connector } from "@/lib/connectors/connectors";

interface AddConnectorFormProps {
  ccPairs: ConnectorIndexingStatus<any, any>[];
  teamspace: Teamspace;
  onClose: () => void;
}

export const AddConnectorForm: React.FC<AddConnectorFormProps> = ({
  ccPairs,
  teamspace,
  onClose,
}) => {
  const [selectedCCPairIds, setSelectedCCPairIds] = useState<number[]>([]);
  const { toast } = useToast();

  const selectedCCPairs = ccPairs.filter((ccPair) =>
    selectedCCPairIds.includes(ccPair.cc_pair_id)
  );
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-x-2">
        {selectedCCPairs.length > 0 &&
          selectedCCPairs.map((ccPair) => (
            <Badge
              key={ccPair.cc_pair_id}
              onClick={() => {
                setSelectedCCPairIds(
                  selectedCCPairIds.filter(
                    (ccPairId) => ccPairId !== ccPair.cc_pair_id
                  )
                );
              }}
              variant="outline"
              className="cursor-pointer hover:bg-opacity-80"
            >
              <ConnectorTitle
                ccPairId={ccPair.cc_pair_id}
                ccPairName={ccPair.name}
                connector={ccPair.connector}
                isLink={false}
                showMetadata={false}
              />
              <X className="ml-1 my-auto cursor-pointer" size={14} />
            </Badge>
          ))}
      </div>

      <div className="flex gap-3">
        <SearchMultiSelectDropdown
          options={ccPairs
            .filter(
              (ccPair) =>
                !selectedCCPairIds.includes(ccPair.cc_pair_id) &&
                !teamspace.cc_pairs
                  .map((teamspaceCCPair) => teamspaceCCPair.id)
                  .includes(ccPair.cc_pair_id)
            )
            // remove public docs, since they don't make sense as part of a group
            .filter((ccPair) => !(ccPair.access_type === "public"))
            .map((ccPair) => {
              return {
                name: ccPair.name?.toString() || "",
                value: ccPair.cc_pair_id?.toString(),
                metadata: {
                  ccPairId: ccPair.cc_pair_id,
                  connector: ccPair.connector,
                },
              };
            })}
          onSelect={(option) => {
            setSelectedCCPairIds([
              ...Array.from(
                new Set([
                  ...selectedCCPairIds,
                  parseInt(option.value as string),
                ])
              ),
            ]);
          }}
          itemComponent={({ option }) => (
            <div className="flex px-4 py-2.5 hover:bg-hover cursor-pointer">
              <div className="my-auto">
                <ConnectorTitle
                  ccPairId={option?.metadata?.ccPairId as number}
                  ccPairName={option.name}
                  connector={option?.metadata?.connector as Connector<any>}
                  isLink={false}
                  showMetadata={false}
                />
              </div>
              <div className="ml-auto my-auto">
                <Plus size={16} />
              </div>
            </div>
          )}
        />
        <Button
          onClick={async () => {
            const newCCPairIds = [
              ...Array.from(
                new Set(
                  teamspace.cc_pairs
                    .map((ccPair) => ccPair.id)
                    .concat(selectedCCPairIds)
                )
              ),
            ];
            const response = await updateTeamspace(teamspace.id, {
              user_ids: teamspace.users.map((user) => user.id),
              cc_pair_ids: newCCPairIds,
            });
            if (response.ok) {
              toast({
                title: "Users Added Successfully!",
                description:
                  "The selected users have been successfully added to the teamspace.",
                variant: "success",
              });
              onClose();
            } else {
              const responseJson = await response.json();
              const errorMsg = responseJson.detail || responseJson.message;
              toast({
                title: "Oops! Something Went Wrong",
                description: `Failed to add users to the group: ${errorMsg}. Please try again.`,
                variant: "destructive",
              });
              onClose();
            }
          }}
        >
          Add Data Sources
        </Button>
      </div>
    </div>
  );
};
