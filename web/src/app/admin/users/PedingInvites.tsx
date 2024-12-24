"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import useSWR from "swr";
import { UsersResponse } from "@/lib/users/interfaces";
import { errorHandlingFetcher } from "@/lib/fetcher";
import { Loading } from "@/components/Loading";
import { ErrorCallout } from "@/components/ErrorCallout";
import { UserIcon } from "lucide-react";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CustomModal } from "@/components/CustomModal";
import { useToast } from "@/hooks/use-toast";
import useSWRMutation from "swr/mutation";
import userMutationFetcher from "@/lib/admin/users/userMutationFetcher";
import { CustomPagination } from "./Pagination";

const RemoveUserButton = ({
  user,
  onSuccess,
  onError,
  teamspaceId,
}: {
  user: User;
  onSuccess: () => void;
  onError: () => void;
  teamspaceId?: string | string[];
}) => {
  const { trigger } = useSWRMutation(
    teamspaceId
      ? `/api/manage/admin/remove-invited-user?teamspace_id=${teamspaceId}`
      : "/api/manage/admin/remove-invited-user",
    userMutationFetcher,
    { onSuccess, onError }
  );
  return (
    <Button
      variant="destructive"
      onClick={() => trigger({ user_email: user.email })}
    >
      Uninvite User
    </Button>
  );
};

export const PendingInvites = ({
  teamspaceId,
  isLoadingDomains,
}: {
  teamspaceId?: string | string[];
  isLoadingDomains: boolean;
}) => {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const { data, isLoading, mutate, error } = useSWR<UsersResponse>(
    teamspaceId
      ? `/api/manage/users?q=${q}&accepted_page=0&invited_page=0&teamspace_id=${teamspaceId}`
      : `/api/manage/users?q=${q}&accepted_page=0&invited_page=0`,
    errorHandlingFetcher
  );

  if (error) {
    return (
      <ErrorCallout
        errorTitle="Error loading users"
        errorMsg={error?.info?.detail}
      />
    );
  }

  if (isLoadingDomains) {
    return <Loading />;
  }

  const finalInvited = data?.invited.filter(
    (user) => !data.accepted.map((u) => u.email).includes(user.email)
  );

  const filteredUsers = finalInvited?.filter((user) =>
    user.email.toLowerCase().includes(q.toLowerCase())
  );

  const totalPages = Math.ceil((filteredUsers?.length || 0) / usersPerPage);
  const displayedUsers = filteredUsers?.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const onRemovalSuccess = () => {
    toast({
      title: "User Removed Successfully",
      description: "The invited user has been removed from your list",
      variant: "success",
    });
    mutate();
    setIsCancelModalVisible(false);
  };

  const onRemovalError = () => {
    toast({
      title: "Failed to Remove User",
      description:
        "We encountered an issue while attempting to remove the invited user. Please try again or contact support if the problem persists",
      variant: "destructive",
    });
    setIsCancelModalVisible(false);
  };

  return (
    <>
      {isCancelModalVisible && (
        <CustomModal
          trigger={null}
          title="Revoke Invite"
          description="Revoking an invite will no longer allow this person to become a member of your space. You can always invite them again if you change your mind."
          onClose={() => {
            setIsCancelModalVisible(false);
            setSelectedUser(null);
          }}
          open={isCancelModalVisible}
        >
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setIsCancelModalVisible(false)}>
              Keep Invite
            </Button>
            {selectedUser && (
              <RemoveUserButton
                user={selectedUser}
                onSuccess={onRemovalSuccess}
                onError={onRemovalError}
                teamspaceId={teamspaceId}
              />
            )}
          </div>
        </CustomModal>
      )}

      <div className="flex gap-10 w-full flex-col xl:gap-20 xl:flex-row">
        <div className="xl:w-1/3">
          <h2 className="text-lg md:text-2xl text-strong font-bold">
            Pending Invites
          </h2>
          <p className="text-sm mt-2">Invitations awaiting a response.</p>
        </div>

        <div className="flex-1 space-y-4 overflow-x-auto p-1">
          <Input
            placeholder="Search user..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          {isLoading ? (
            <Loading />
          ) : displayedUsers && displayedUsers.length > 0 ? (
            <div>
              <Card className="mt-4">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-4">
                              <div className="border rounded-full w-10 h-10 flex items-center justify-center">
                                <UserIcon />
                              </div>
                              <span className="text-sm text-subtle truncate">
                                {user.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 justify-end">
                              <Button
                                onClick={() => {
                                  setIsCancelModalVisible(true);
                                  setSelectedUser(user);
                                }}
                                variant="destructive"
                              >
                                Cancel Invite
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {filteredUsers && filteredUsers.length > 10 && (
                <div className="flex justify-center mt-4">
                  <CustomPagination
                    totalItems={filteredUsers?.length || 0}
                    itemsPerPage={usersPerPage}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          ) : (
            <p>No user found.</p>
          )}
        </div>
      </div>
    </>
  );
};
