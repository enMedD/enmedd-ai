"use client";

import { ErrorCallout } from "@/components/ErrorCallout";
import {
  refreshDocumentSets,
  useConnectorCredentialIndexingStatus,
  useDocumentSets,
  useTeamspaces,
} from "@/lib/hooks";
import { Loading } from "@/components/Loading";
import { AdminPageTitle } from "@/components/admin/Title";
import { BackButton } from "@/components/BackButton";
import { DocumentSetCreationForm } from "../DocumentSetCreationForm";
import { useParams, useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function Main({ documentSetId }: { documentSetId: number }) {
  const router = useRouter();
  const { teamspaceId } = useParams();

  const {
    data: documentSets,
    isLoading: isDocumentSetsLoading,
    error: documentSetsError,
  } = useDocumentSets();

  const {
    data: ccPairs,
    isLoading: isCCPairsLoading,
    error: ccPairsError,
  } = useConnectorCredentialIndexingStatus();

  // EE only
  const { data: teamspaces, isLoading: teamspacesIsLoading } = useTeamspaces();

  if (isDocumentSetsLoading || isCCPairsLoading || teamspacesIsLoading) {
    return <Loading />;
  }

  if (documentSetsError || !documentSets) {
    return (
      <ErrorCallout
        errorTitle="Failed to fetch document sets"
        errorMsg={documentSetsError}
      />
    );
  }

  if (ccPairsError || !ccPairs) {
    return (
      <ErrorCallout
        errorTitle="Failed to fetch Data Sources"
        errorMsg={ccPairsError}
      />
    );
  }

  const documentSet = documentSets.find(
    (documentSet) => documentSet.id === documentSetId
  );
  if (!documentSet) {
    return (
      <ErrorCallout
        errorTitle="Document set not found"
        errorMsg={`Document set with id ${documentSetId} not found`}
      />
    );
  }

  return (
    <div>
      <AdminPageTitle icon={<Bookmark size={32} />} title={documentSet.name} />

      <Card>
        <CardContent>
          <DocumentSetCreationForm
            ccPairs={ccPairs}
            teamspaces={teamspaces}
            onClose={() => {
              refreshDocumentSets();
              router.push(
                teamspaceId
                  ? `/t/${teamspaceId}/admin/documents/sets`
                  : "/admin/documents/sets"
              );
            }}
            existingDocumentSet={documentSet}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function Page({
  params,
}: {
  params: { documentSetId: string };
}) {
  const documentSetId = parseInt(params.documentSetId);

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container">
        <BackButton />

        <Main documentSetId={documentSetId} />
      </div>
    </div>
  );
}
