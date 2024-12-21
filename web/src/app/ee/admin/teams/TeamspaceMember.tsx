"use client";

import { CustomModal } from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Teamspace, User } from "@/lib/types";
import { Crown, Minus, Pencil, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CustomTooltip } from "@/components/CustomTooltip";
import { SearchInput } from "@/components/SearchInput";
import { UserProfile } from "@/components/UserProfile";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user/UserProvider";
import { useTeamspaceUsers, useUsers } from "@/lib/hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InviteUserButton } from "@/app/admin/users/InviteUserButton";

interface MemberContentProps {
  isGlobal?: boolean;
  teamspace: Teamspace;
  refreshTeamspaces: () => void;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  filteredUsers: User[] | undefined;
  refreshTeamspaceUsers: () => void;
  setSelectedUsers: Dispatch<SetStateAction<string[]>>;
  selectedUsers: string[];
}

const MemberContent = ({
  isGlobal,
  teamspace,
  refreshTeamspaces,
  searchTerm,
  setSearchTerm,
  filteredUsers,
  refreshTeamspaceUsers,
  setSelectedUsers,
  selectedUsers,
}: MemberContentProps) => {
  const { toast } = useToast();
  const [isAllSelected, setIsAllSelected] = useState(false);

  const handleCheckboxChange = (userEmail: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userEmail)
        ? prev.filter((email) => email !== userEmail)
        : [...prev, userEmail]
    );
  };

  const handleHeaderCheckboxChange = () => {
    if (isAllSelected) {
      setSelectedUsers([]);
    } else {
      const usersToSelect = isGlobal
        ? filteredUsers!.map((user) => user.email)
        : filteredUsers!
            .filter((user) => user.id !== teamspace.creator.id)
            .map((user) => user.email);

      setSelectedUsers(usersToSelect);
    }
  };

  useEffect(() => {
    // Check if all applicable users are selected
    const applicableUsers = isGlobal
      ? filteredUsers
      : filteredUsers?.filter((user) => user.id !== teamspace.creator.id);

    const allSelected =
      (applicableUsers &&
        applicableUsers?.length > 0 &&
        applicableUsers.every((user) => selectedUsers.includes(user.email))) ??
      false;

    setIsAllSelected(allSelected);
  }, [selectedUsers, filteredUsers, isGlobal, teamspace.creator.id]);

  const handleRoleChange = async (userEmail: string, newRole: string) => {
    try {
      await fetch(`/api/manage/admin/teamspace/user-role/${teamspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userEmail,
          new_role: newRole,
        }),
      });
      toast({
        title: "Success",
        description: `Role updated to ${newRole}`,
        variant: "success",
      });
      refreshTeamspaceUsers();
      refreshTeamspaces();
    } catch (error) {
      console.error("Failed to update role", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`space-y-4 ${isGlobal ? "cursor-pointer" : ""}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg leading-none tracking-tight lg:text-xl font-semibold">
          {isGlobal ? "Available" : "Current"} User
        </h2>
        <div className="w-1/2">
          <SearchInput
            placeholder="Search users..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
      </div>
      <div className="pb-6">
        {filteredUsers && filteredUsers?.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleHeaderCheckboxChange}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email Address</TableHead>
                    {!isGlobal && <TableHead>Role</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {(isGlobal || teamspace.creator.id !== user.id) && (
                          <Checkbox
                            checked={selectedUsers.includes(user.email)}
                            onCheckedChange={() =>
                              handleCheckboxChange(user.email)
                            }
                          />
                        )}
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        <UserProfile user={user} size={40} />
                        <div className="grid">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold whitespace-nowrap">
                              {user.full_name}
                            </span>
                            {user.id !== teamspace.creator.id && !isGlobal && (
                              <Badge
                                variant={
                                  user.role === "admin"
                                    ? "success"
                                    : "secondary"
                                }
                              >
                                {user.role === "admin" ? "Admin" : "User"}
                              </Badge>
                            )}

                            {user.id === teamspace.creator.id && (
                              <Badge>Creator</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {!isGlobal ? (
                          <Select
                            value={user.role || "basic"}
                            onValueChange={(newRole) =>
                              handleRoleChange(user.email, newRole)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          ""
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <p className="flex items-center justify-center py-4">
            No users found.
          </p>
        )}
      </div>
    </div>
  );
};

interface TeamspaceMemberProps {
  teamspace: Teamspace & { gradient: string };
  refreshTeamspaces: () => void;
}

export const TeamspaceMember = ({
  teamspace,
  refreshTeamspaces,
}: TeamspaceMemberProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshUsers } = useUsers();
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [searchTermAvailableUser, setSearchTermAvailableUser] = useState("");
  const [searchTermCurrentUser, setSearchTermCurrentUse] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { user } = useUser();
  const { data: users, refreshTeamspaceUsers } = useTeamspaceUsers(
    teamspace.id.toString()
  );

  const filteredCurrentUsers = teamspace.users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTermCurrentUser.toLowerCase()) ||
      user.full_name
        ?.toLowerCase()
        .includes(searchTermCurrentUser.toLowerCase())
  );

  const filteredAvaillableUsers =
    users?.filter(
      (user) =>
        user.email
          ?.toLowerCase()
          .includes(searchTermAvailableUser.toLowerCase()) ||
        user.full_name
          ?.toLowerCase()
          .includes(searchTermAvailableUser.toLowerCase())
    ) ?? [];

  const usersToDisplay = [
    ...teamspace.users.sort((a, b) =>
      a.id === user?.id ? -1 : b.id === user?.id ? 1 : 0
    ),
  ].slice(0, 8);

  const handleRemoveUser = async () => {
    const remainingAdmins = filteredCurrentUsers?.filter(
      (user) => user.role === "admin"
    );

    if (
      remainingAdmins?.length === 1 &&
      selectedUsers.includes(remainingAdmins[0].email)
    ) {
      toast({
        title: "Action Forbidden",
        description:
          "At least one admin must remain in the teamspace. You cannot remove the last admin.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/manage/admin/teamspace/user-remove/${teamspace.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selectedUsers),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete user");
      }

      toast({
        title: "User Removed",
        description:
          "The user has been successfully removed from the teamspace.",
        variant: "success",
      });
      refreshUsers();
      refreshTeamspaces();
      refreshTeamspaceUsers();
      setSelectedUsers([]);
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: `Failed to remove the user: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unknown error occurred while removing the user.",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddUsers = async () => {
    try {
      const response = await fetch(
        `/api/manage/admin/teamspace/user-add/${teamspace.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedUsers),
        }
      );

      if (!response.ok) throw new Error("Failed to add users");

      toast({
        title: "Success",
        description: "Users added successfully",
        variant: "success",
      });
      refreshUsers();
      refreshTeamspaceUsers();
      refreshTeamspaces();
      setSelectedUsers([]);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to add users",
        variant: "destructive",
      });
    }
  };

  return (
    <CustomModal
      className="pb-0"
      trigger={
        <div
          className={`rounded-md bg-background-subtle w-full p-4 min-h-36 flex flex-col justify-between ${teamspace.is_up_to_date && !teamspace.is_up_for_deletion && "cursor-pointer"}`}
          onClick={() =>
            setIsMemberModalOpen(
              teamspace.is_up_to_date && !teamspace.is_up_for_deletion
                ? true
                : false
            )
          }
        >
          <div className="flex items-center justify-between">
            <h3>
              Members <span className="px-2 font-normal">|</span>{" "}
              {teamspace.users.length}
            </h3>
            {teamspace.is_up_to_date && !teamspace.is_up_for_deletion && (
              <Pencil size={16} />
            )}
          </div>

          {teamspace.users.length > 0 ? (
            <div className="pt-8 flex flex-wrap -space-x-3">
              {usersToDisplay.map((user) => (
                <CustomTooltip
                  variant="white"
                  key={user.id}
                  trigger={<UserProfile user={user} />}
                >
                  {user.email == teamspace.creator.email && (
                    <Crown size={16} className="me-2" />
                  )}
                  {user.full_name}
                </CustomTooltip>
              ))}
              {teamspace.users.length > 8 && (
                <div className="bg-background w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">
                  +{teamspace.users.length - 8}
                </div>
              )}
            </div>
          ) : (
            <p>There are no member.</p>
          )}
        </div>
      }
      title="Members"
      open={isMemberModalOpen}
      onClose={() => {
        setSelectedUsers([]);
        setIsMemberModalOpen(false);
      }}
    >
      <div className="flex flex-col h-full">
        <div className="flex-grow space-y-12">
          <div className="flex justify-end">
            <InviteUserButton
              teamspaceId={teamspace.id.toString()}
              isTeamspaceModal
            />
          </div>

          <MemberContent
            teamspace={teamspace}
            refreshTeamspaces={refreshTeamspaces}
            searchTerm={searchTermCurrentUser}
            setSearchTerm={setSearchTermCurrentUse}
            filteredUsers={filteredCurrentUsers}
            refreshTeamspaceUsers={refreshTeamspaceUsers}
            setSelectedUsers={setSelectedUsers}
            selectedUsers={selectedUsers}
          />

          <MemberContent
            isGlobal
            teamspace={teamspace}
            refreshTeamspaces={refreshTeamspaces}
            searchTerm={searchTermAvailableUser}
            setSearchTerm={setSearchTermAvailableUser}
            filteredUsers={filteredAvaillableUsers}
            refreshTeamspaceUsers={refreshTeamspaceUsers}
            setSelectedUsers={setSelectedUsers}
            selectedUsers={selectedUsers}
          />
        </div>

        <div
          className={`sticky bottom-0 left-0 right-0 py-6 bg-white border-gray-200 z-10 flex justify-end gap-2 ${
            selectedUsers.length > 0 ? "border-t" : ""
          }`}
        >
          {filteredCurrentUsers.length > 0 &&
            selectedUsers.some((userEmail) =>
              filteredCurrentUsers.some((user) => user.email === userEmail)
            ) && (
              <Button onClick={handleRemoveUser} variant="destructive">
                <Minus size={16} /> Remove Selected Users
              </Button>
            )}

          {filteredAvaillableUsers.length > 0 &&
            selectedUsers.some((userEmail) =>
              filteredAvaillableUsers.some((user) => user.email === userEmail)
            ) && (
              <Button onClick={handleAddUsers}>
                <Plus size={16} /> Add Selected Users
              </Button>
            )}
        </div>
      </div>
    </CustomModal>
  );
};
