"use client";

import { AdminPageTitle } from "@/components/admin/Title";
import {
  refreshDocumentSets,
  useConnectorCredentialIndexingStatus,
  useTeamspaces,
} from "@/lib/hooks";
import { Loading } from "@/components/Loading";
import { BackButton } from "@/components/BackButton";
import { ErrorCallout } from "@/components/ErrorCallout";
import { useParams, useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentSetCreationForm } from "@/app/admin/documents/sets/DocumentSetCreationForm";

function Main() {
  const { teamspaceId } = useParams();
  const router = useRouter();

  const {
    data: ccPairs,
    isLoading: isCCPairsLoading,
    error: ccPairsError,
  } = useConnectorCredentialIndexingStatus(undefined, false, teamspaceId);

  // EE only
  const { data: teamspaces, isLoading: teamspacesIsLoading } = useTeamspaces();

  if (isCCPairsLoading || teamspacesIsLoading) {
    return <Loading />;
  }

  if (ccPairsError || !ccPairs) {
    return (
      <ErrorCallout
        errorTitle="Failed to fetch Data Sources"
        errorMsg={ccPairsError}
      />
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <DocumentSetCreationForm
            ccPairs={ccPairs}
            teamspaces={teamspaces}
            onClose={() => {
              refreshDocumentSets();
              router.push(`/t/${teamspaceId}/admin/documents/sets`);
            }}
            teamspaceId={teamspaceId}
          />
        </CardContent>
      </Card>
    </>
  );
}

const Page = () => {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container">
        <BackButton />

        <AdminPageTitle
          icon={<Bookmark size={32} />}
          title="New Document Set"
        />

        <Main />
      </div>
    </div>
  );
};

export default Page;
