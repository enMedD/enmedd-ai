"use client";

import { CustomModal } from "@/components/CustomModal";
import { SearchInput } from "@/components/SearchInput";
import { Button } from "@/components/ui/button";
import { DocumentSet, Teamspace } from "@/lib/types";
import { Globe, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { CustomTooltip } from "@/components/CustomTooltip";
import { TEAMSPACE_SUCCESS_MESSAGES } from "@/constants/toast/success";
import { OPERATION_ERROR_MESSAGES } from "@/constants/toast/error";

interface TeamspaceDocumentSetProps {
  teamspace: Teamspace & { gradient: string };
  documentSets: DocumentSet[];
  refreshTeamspaces: () => void;
}

interface DocumentSetContentProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredDocumentSets: DocumentSet[];
  isGlobal?: boolean;
  onSelect?: (documentSet: DocumentSet) => void;
  selectedDocumentSets?: DocumentSet[];
}

const DocumentSetContent = ({
  searchTerm,
  setSearchTerm,
  filteredDocumentSets,
  isGlobal,
  onSelect,
}: DocumentSetContentProps) => {
  return (
    <div className={isGlobal ? "cursor-pointer" : ""}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg leading-none tracking-tight lg:text-xl font-semibold">
          {isGlobal ? "Available" : "Current"} Document Sets
        </h2>
        <div className="w-1/2">
          <SearchInput
            placeholder="Search document sets..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
      </div>
      {filteredDocumentSets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredDocumentSets.map((documentSet) => (
            <div
              key={documentSet.id}
              className="border rounded-md flex items-start gap-4 p-4 cursor-pointer hover:bg-background-subtle transition-all duration-200 ease-in-out"
              onClick={() => onSelect && onSelect(documentSet)}
            >
              <Globe className="shrink-0" />
              <div className="w-full">
                <div className="flex justify-between w-full">
                  <h3 className="line-clamp">{documentSet.name}</h3>
                </div>
                <p className="text-sm pt-2 line-clamp">
                  {documentSet.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>There are no {isGlobal ? "Available" : "Current"} Document Sets.</p>
      )}
    </div>
  );
};

export const TeamspaceDocumentSet = ({
  teamspace,
  documentSets,
  refreshTeamspaces,
}: TeamspaceDocumentSetProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isDocumentSetModalOpen, setIsDocumentSetModalOpen] = useState(false);
  const [searchTermCurrent, setSearchTermCurrent] = useState("");
  const [searchTermGlobal, setSearchTermGlobal] = useState("");

  const [currentDocumentSets, setCurrentDocumentSets] = useState<DocumentSet[]>(
    teamspace.document_sets
  );

  useEffect(() => {
    setCurrentDocumentSets(teamspace.document_sets);
  }, [teamspace]);

  const [globalDocumentSets, setGlobalDocumentSets] = useState<DocumentSet[]>(
    () =>
      documentSets.filter(
        (documentSet) =>
          documentSet.is_public &&
          !teamspace.document_sets.some(
            (currentDocumentSet) => currentDocumentSet.id === documentSet.id
          )
      )
  );

  const [tempCurrentDocumentSets, setTempCurrentDocumentSets] =
    useState<DocumentSet[]>(currentDocumentSets);
  const [tempGlobalDocumentSets, setTempGlobalDocumentSets] =
    useState<DocumentSet[]>(globalDocumentSets);

  useEffect(() => {
    setTempCurrentDocumentSets(currentDocumentSets);

    const updatedGlobalDocumentSets = documentSets.filter(
      (documentSet) =>
        documentSet.is_public &&
        !currentDocumentSets.some(
          (currentDocumentSet) => currentDocumentSet.id === documentSet.id
        )
    );

    setGlobalDocumentSets(updatedGlobalDocumentSets);
    setTempGlobalDocumentSets(updatedGlobalDocumentSets);
  }, [currentDocumentSets, documentSets]);

  const handleSelectDocumentSet = (documentSet: DocumentSet) => {
    if (tempCurrentDocumentSets.some((a) => a.id === documentSet.id)) {
      setTempCurrentDocumentSets((prev) =>
        prev.filter((a) => a.id !== documentSet.id)
      );
      setTempGlobalDocumentSets((prev) => [...prev, documentSet]);
    } else {
      setTempCurrentDocumentSets((prev) => [...prev, documentSet]);
      setTempGlobalDocumentSets((prev) =>
        prev.filter((a) => a.id !== documentSet.id)
      );
    }
  };

  const handleSaveChanges = async () => {
    try {
      const response = await fetch(
        `/api/manage/admin/teamspace/${teamspace.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_ids: teamspace.users.map((user) => user.id),
            cc_pair_ids: teamspace.cc_pairs.map((ccPair) => ccPair.id),
            assistant_ids: teamspace.assistants.map((docSet) => docSet.id),
            document_set_ids: tempCurrentDocumentSets.map(
              (documentSet) => documentSet.id
            ),
          }),
        }
      );

      const responseJson = await response.json();

      if (!response.ok) {
        toast({
          title: OPERATION_ERROR_MESSAGES.ACTION.title("Update"),
          description: OPERATION_ERROR_MESSAGES.ACTION.description(
            "document sets",
            "update",
            responseJson.detail || "Unknown error."
          ),
          variant: "destructive",
        });
        return;
      }
      router.refresh();
      setCurrentDocumentSets(tempCurrentDocumentSets);
      setGlobalDocumentSets(tempGlobalDocumentSets);
      toast({
        title: TEAMSPACE_SUCCESS_MESSAGES.UPDATE_TYPE.title("Document Sets"),
        description:
          TEAMSPACE_SUCCESS_MESSAGES.UPDATE_TYPE.description("Document Sets"),
        variant: "success",
      });
      refreshTeamspaces();
    } catch (error) {
      toast({
        title: OPERATION_ERROR_MESSAGES.ACTION.title("Update"),
        description: OPERATION_ERROR_MESSAGES.ACTION.description(
          "document sets",
          "update",
          error || "Unknown error."
        ),
        variant: "destructive",
      });
    }

    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsDocumentSetModalOpen(false);
    setTempCurrentDocumentSets(currentDocumentSets);
    setTempGlobalDocumentSets(globalDocumentSets);
  };

  return (
    <CustomModal
      className="pb-0"
      trigger={
        <div
          className={`rounded-md bg-background-subtle w-full p-4 min-h-36 flex flex-col justify-between ${teamspace.is_up_to_date && !teamspace.is_up_for_deletion && "cursor-pointer"}`}
          onClick={() =>
            setIsDocumentSetModalOpen(
              teamspace.is_up_to_date && !teamspace.is_up_for_deletion
                ? true
                : false
            )
          }
        >
          <div className="flex items-center justify-between">
            <h3>
              Document Set <span className="px-2 font-normal">|</span>{" "}
              {currentDocumentSets.length}
            </h3>
            {teamspace.is_up_to_date && !teamspace.is_up_for_deletion && (
              <Pencil size={16} />
            )}
          </div>

          {teamspace.document_sets.length > 0 ? (
            <div className="pt-8 flex flex-wrap -space-x-3">
              {currentDocumentSets.slice(0, 8).map((documentSet) => (
                <CustomTooltip
                  variant="white"
                  key={documentSet.id}
                  trigger={
                    <div
                      key={documentSet.id}
                      className="bg-brand-500 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-inverted text-lg uppercase border-[1px] border-white"
                    >
                      {documentSet.name!.charAt(0)}
                    </div>
                  }
                >
                  {documentSet.name}
                </CustomTooltip>
              ))}
              {currentDocumentSets.length > 8 && (
                <div className="bg-background w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">
                  +{currentDocumentSets.length - 8}
                </div>
              )}
            </div>
          ) : (
            <p>There are no document set.</p>
          )}
        </div>
      }
      title="Document Sets"
      open={isDocumentSetModalOpen}
      onClose={handleCloseModal}
    >
      <div className="flex flex-col h-full">
        <div className="flex-grow space-y-12 pb-20">
          <DocumentSetContent
            searchTerm={searchTermCurrent}
            setSearchTerm={setSearchTermCurrent}
            filteredDocumentSets={tempCurrentDocumentSets.filter(
              (documentSet) =>
                documentSet.name
                  ?.toLowerCase()
                  .includes(searchTermCurrent.toLowerCase())
            )}
            onSelect={handleSelectDocumentSet}
          />

          <DocumentSetContent
            searchTerm={searchTermGlobal}
            setSearchTerm={setSearchTermGlobal}
            filteredDocumentSets={tempGlobalDocumentSets.filter((documentSet) =>
              documentSet.name
                ?.toLowerCase()
                .includes(searchTermGlobal.toLowerCase())
            )}
            isGlobal
            onSelect={handleSelectDocumentSet}
          />
        </div>
        <div className="sticky bottom-0 left-0 right-0 py-6 bg-white border-t border-gray-200 z-10 flex justify-end gap-2">
          <Button onClick={handleCloseModal} variant="ghost">
            Cancel
          </Button>
          <Button onClick={handleSaveChanges}>Save changes</Button>
        </div>
      </div>
    </CustomModal>
  );
};
