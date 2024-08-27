"use client";

import { TeamspacesIcon } from "@/components/icons/icons";
import { TeamspaceDisplay } from "./TeamspaceDisplay";
import { FiAlertCircle, FiChevronLeft } from "react-icons/fi";
import { useSpecificTeamspace } from "./hook";
import { ThreeDotsLoader } from "@/components/Loading";
import { useConnectorCredentialIndexingStatus, useUsers } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { AdminPageTitle } from "@/components/admin/Title";

const Page = ({ params }: { params: { teamspaceId: string } }) => {
  const router = useRouter();

  const {
    teamspace,
    isLoading: teamspaceIsLoading,
    error: teamspaceError,
    refreshTeamspace,
  } = useSpecificTeamspace(params.teamspaceId);
  const {
    data: users,
    isLoading: userIsLoading,
    error: usersError,
  } = useUsers();
  const {
    data: ccPairs,
    isLoading: isCCPairsLoading,
    error: ccPairsError,
  } = useConnectorCredentialIndexingStatus();

  if (teamspaceIsLoading || userIsLoading || isCCPairsLoading) {
    return (
      <div className="h-full">
        <div className="my-auto">
          <ThreeDotsLoader />
        </div>
      </div>
    );
  }

  if (!teamspace || teamspaceError) {
    return <div>Error loading teamspace</div>;
  }
  if (!users || usersError) {
    return <div>Error loading users</div>;
  }
  if (!ccPairs || ccPairsError) {
    return <div>Error loading connectors</div>;
  }

  return (
    <div className="mx-auto container">
      <BackButton />

      <AdminPageTitle
        title={teamspace.name || "Unknown"}
        icon={<TeamspacesIcon size={32} />}
      />

      {teamspace ? (
        <TeamspaceDisplay
          users={users.accepted}
          ccPairs={ccPairs}
          teamspace={teamspace}
          refreshTeamspace={refreshTeamspace}
        />
      ) : (
        <div>Unable to fetch Teamspace :(</div>
      )}
    </div>
  );
};

export default Page;
