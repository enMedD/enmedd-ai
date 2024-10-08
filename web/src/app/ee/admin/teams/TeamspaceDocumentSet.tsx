/* "use client";

import { CustomModal } from "@/components/CustomModal";
import { SearchInput } from "@/components/SearchInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentSet, Teamspace } from "@/lib/types";
import { BookmarkIcon, Globe, Plus } from "lucide-react";
import { useState } from "react";
import { DeleteModal } from "./DeleteModal";
import { useDocumentSets } from "@/app/admin/documents/sets/hooks";

interface TeamspaceDocumentSetProps {
  teamspace: Teamspace & { gradient: string };
}

interface DocumentSetProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredDocumentSets: DocumentSet[] | undefined;
  isGlobal?: boolean;
  onSelect: (documentSet: DocumentSet) => void;
  selectedDocumentSets: DocumentSet[];
}

const DocumentSetContent = ({
  searchTerm,
  setSearchTerm,
  filteredDocumentSets,
  isGlobal,
  onSelect,
  selectedDocumentSets,
}: DocumentSetProps) => {
  return (
    <div className={isGlobal ? "cursor-pointer" : ""}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg leading-none tracking-tight lg:text-xl font-semibold">
          {isGlobal ? "Available" : "Current"} Document Sets
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
        {filteredDocumentSets?.map((document) => (
          <div
            key={document.id}
            className={`border rounded-md flex items-start p-4 gap-4 ${
              selectedDocumentSets.some(
                (selected) => selected.id === document.id
              )
                ? "bg-primary-300 border-input-colored"
                : ""
            }`}
            onClick={() => onSelect(document)}
          >
            <Globe className="shrink-0" />
            <div className="w-full">
              <div className="flex items-center justify-between w-full">
                <h3 className="line-clamp">{document.name}</h3>
                {!isGlobal ? (
                  <DeleteModal type="Document Set" />
                ) : (
                  <Button variant="ghost" size="smallIcon">
                    <Plus size={16} />
                  </Button>
                )}
              </div>
              <p className="text-sm pt-2 line-clamp">{document.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TeamspaceDocumentSet = ({
  teamspace,
}: TeamspaceDocumentSetProps) => {
  const {
    data: documentSets,
    isLoading: isDocumentSetsLoading,
    error: documentSetsError,
    refreshDocumentSets,
  } = useDocumentSets();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDocumentSetModalOpen, setIsDocumentSetModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocumentSets, setSelectedDocumentSets] = useState<
    DocumentSet[]
  >([]);

  const filteredCurrentDocSet = teamspace.document_sets.filter((docSet) =>
    docSet.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGlobalDocSet = documentSets?.filter(
    (docSet) =>
      docSet.is_public &&
      docSet.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectDocumentSet = (documentSet: DocumentSet) => {
    setSelectedDocumentSets((prev) => {
      const isSelected = prev.some(
        (selected) => selected.id === documentSet.id
      );
      if (isSelected) {
        return prev.filter((selected) => selected.id !== documentSet.id);
      } else {
        return [...prev, documentSet];
      }
    });
  };

  const handleSaveChanges = () => {
    console.log(selectedDocumentSets);
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
        title="Add new document set"
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
            onClick={() => setIsDocumentSetModalOpen(true)}
          >
            <h3>
              Document Set <span className="px-2 font-normal">|</span>{" "}
              {teamspace.document_sets.length}
            </h3>

            {teamspace.document_sets.length > 0 ? (
              <div className="pt-8 flex flex-wrap gap-2">
                {teamspace.document_sets.map((documentSet) => {
                  return (
                    <Badge key={documentSet.id}>
                      <BookmarkIcon size={16} className="shrink-0" />
                      <span className="truncate">{documentSet.name}</span>
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <p>There are document set.</p>
            )}
          </div>
        }
        title="Document Sets"
        open={isDocumentSetModalOpen}
        onClose={() => setIsDocumentSetModalOpen(false)}
      >
        {teamspace.document_sets.length > 0 ? (
          <div className="space-y-12">
            <DocumentSetContent
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredDocumentSets={filteredCurrentDocSet}
              onSelect={handleSelectDocumentSet}
              selectedDocumentSets={selectedDocumentSets}
            />
            <DocumentSetContent
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredDocumentSets={filteredGlobalDocSet}
              isGlobal
              onSelect={handleSelectDocumentSet}
              selectedDocumentSets={selectedDocumentSets}
            />
          </div>
        ) : (
          "There are no document sets."
        )}

        <Button onClick={handleSaveChanges}>Save changes</Button>
      </CustomModal>
    </div>
  );
}; */

"use client";

import { CustomModal } from "@/components/CustomModal";
import { SearchInput } from "@/components/SearchInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentSet, Teamspace } from "@/lib/types";
import { BookmarkIcon, Globe, Plus } from "lucide-react";
import { useState } from "react";
import { DeleteModal } from "./DeleteModal";
import { useDocumentSets } from "@/app/admin/documents/sets/hooks";

interface TeamspaceDocumentSetProps {
  teamspace: Teamspace & { gradient: string };
  documentSets: DocumentSet[] | undefined;
}

interface DocumentSetProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredDocumentSets: DocumentSet[] | undefined;
  isGlobal?: boolean;
  onSelect: (documentSet: DocumentSet) => void;
  selectedDocumentSets: DocumentSet[];
}

const DocumentSetContent = ({
  searchTerm,
  setSearchTerm,
  filteredDocumentSets,
  isGlobal,
  onSelect,
  selectedDocumentSets,
}: DocumentSetProps) => {
  return (
    <div className={isGlobal ? "cursor-pointer" : ""}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg leading-none tracking-tight lg:text-xl font-semibold">
          {isGlobal ? "Available" : "Current"} Document Sets
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
        {filteredDocumentSets?.map((document) => (
          <div
            key={document.id}
            className={`border rounded-md flex items-start p-4 gap-4 ${
              selectedDocumentSets.some(
                (selected) => selected.id === document.id
              )
                ? "bg-primary-300 border-input-colored"
                : ""
            }`}
            onClick={() => onSelect(document)}
          >
            <Globe className="shrink-0" />
            <div className="w-full">
              <div className="flex items-center justify-between w-full">
                <h3 className="line-clamp">{document.name}</h3>
                {!isGlobal ? (
                  <DeleteModal type="Document Set" />
                ) : (
                  <Button variant="ghost" size="smallIcon">
                    <Plus size={16} />
                  </Button>
                )}
              </div>
              <p className="text-sm pt-2 line-clamp">{document.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TeamspaceDocumentSet = ({
  teamspace,
  documentSets,
}: TeamspaceDocumentSetProps) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDocumentSetModalOpen, setIsDocumentSetModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocumentSets, setSelectedDocumentSets] = useState<
    DocumentSet[]
  >([]);

  const filteredCurrentDocSet = teamspace.document_sets.filter((docSet) =>
    docSet.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGlobalDocSet = documentSets?.filter(
    (docSet) =>
      docSet.is_public &&
      docSet.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectDocumentSet = (documentSet: DocumentSet) => {
    setSelectedDocumentSets((prev) => {
      const isSelected = prev.some(
        (selected) => selected.id === documentSet.id
      );
      if (isSelected) {
        return prev.filter((selected) => selected.id !== documentSet.id);
      } else {
        return [...prev, documentSet];
      }
    });
  };

  const handleSaveChanges = async () => {
    const userIds = teamspace.users.map((user) => user.id);
    const ccPairIds = teamspace.cc_pairs.map((ccPair) => ccPair.id);
    const assistantIds = teamspace.assistants.map((assistant) => assistant.id);
    const docSetIds = selectedDocumentSets.map((set) => set.id);

    try {
      const response = await fetch(
        `/api/manage/admin/teamspace/${teamspace.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_ids: userIds,
            cc_pair_ids: ccPairIds,
            document_set_ids: docSetIds,
            assistant_ids: assistantIds,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update document sets");
      }

      const data = await response.json();
      console.log("Document sets updated:", data);
    } catch (error) {
      console.error("Error updating document sets:", error);
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
        title="Add new document set"
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
            onClick={() => setIsDocumentSetModalOpen(true)}
          >
            <h3>
              Document Set <span className="px-2 font-normal">|</span>{" "}
              {teamspace.document_sets.length}
            </h3>

            {teamspace.document_sets.length > 0 ? (
              <div className="pt-8 flex flex-wrap gap-2">
                {teamspace.document_sets.map((documentSet) => {
                  return (
                    <Badge key={documentSet.id}>
                      <BookmarkIcon size={16} className="shrink-0" />
                      <span className="truncate">{documentSet.name}</span>
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <p>There are document set.</p>
            )}
          </div>
        }
        title="Document Sets"
        open={isDocumentSetModalOpen}
        onClose={() => setIsDocumentSetModalOpen(false)}
      >
        {teamspace.document_sets.length > 0 ? (
          <div className="space-y-12">
            <DocumentSetContent
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredDocumentSets={filteredCurrentDocSet}
              onSelect={handleSelectDocumentSet}
              selectedDocumentSets={selectedDocumentSets}
            />
            <DocumentSetContent
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredDocumentSets={filteredGlobalDocSet}
              isGlobal
              onSelect={handleSelectDocumentSet}
              selectedDocumentSets={selectedDocumentSets}
            />
          </div>
        ) : (
          "There are no document sets."
        )}

        <Button onClick={handleSaveChanges}>Save changes</Button>
      </CustomModal>
    </div>
  );
};
