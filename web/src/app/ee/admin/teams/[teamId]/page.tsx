"use client";

import { GroupsIcon } from "@/components/icons/icons";
import { GroupDisplay } from "./GroupDisplay";
import { useSpecificTeamspace } from "./hook";
import { ThreeDotsLoader } from "@/components/Loading";
import { useConnectorCredentialIndexingStatus, useUsers } from "@/lib/hooks";
import { useParams, useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { AdminPageTitle } from "@/components/admin/Title";

const Page = ({ params }: { params: { teamId: string } }) => {
  const router = useRouter();
  const { teamspaceId } = useParams();

  const {
    teamspace,
    isLoading: teamspaceIsLoading,
    error: teamspaceError,
    refreshTeamspace,
  } = useSpecificTeamspace(params.teamId);
  const {
    data: users,
    isLoading: userIsLoading,
    error: usersError,
  } = useUsers();
  const {
    data: ccPairs,
    isLoading: isCCPairsLoading,
    error: ccPairsError,
  } = useConnectorCredentialIndexingStatus(undefined, false, teamspaceId);

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
    <div className="h-full w-full overflow-y-auto">
      <div className="container">
        <BackButton />

        <AdminPageTitle
          title={teamspace.name || "Unknown"}
          icon={<GroupsIcon size={32} />}
        />

        {teamspace ? (
          <GroupDisplay
            users={users.accepted}
            ccPairs={ccPairs}
            teamspace={teamspace}
            refreshTeamspace={refreshTeamspace}
          />
        ) : (
          <div>Unable to fetch Teamspace :(</div>
        )}
      </div>
    </div>
  );
};

export default Page;
