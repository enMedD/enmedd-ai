"use client";

import { BackButton } from "@/components/BackButton";
import { ThreeDotsLoader } from "@/components/Loading";
import { AdminPageTitle } from "@/components/admin/Title";
import { GroupsIcon } from "@/components/icons/icons";
import { useConnectorCredentialIndexingStatus, useUsers } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { GroupDisplay } from "./GroupDisplay";
import { useSpecificUserGroup } from "./hook";

const Page = ({ params }: { params: { groupId: string } }) => {
  const router = useRouter();

  const {
    userGroup,
    isLoading: userGroupIsLoading,
    error: userGroupError,
    refreshUserGroup,
  } = useSpecificUserGroup(params.groupId);
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

  if (userGroupIsLoading || userIsLoading || isCCPairsLoading) {
    return (
      <div className="h-full">
        <div className="my-auto">
          <ThreeDotsLoader />
        </div>
      </div>
    );
  }

  if (!userGroup || userGroupError) {
    return <div>Error loading user group</div>;
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
        title={userGroup.name || "Unknown"}
        icon={<GroupsIcon size={32} />}
      />

      {userGroup ? (
        <GroupDisplay
          users={users.accepted}
          ccPairs={ccPairs}
          userGroup={userGroup}
          refreshUserGroup={refreshUserGroup}
        />
      ) : (
        <div>Unable to fetch User Group :(</div>
      )}
    </div>
  );
};

export default Page;
