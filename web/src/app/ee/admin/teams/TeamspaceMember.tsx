"use client";

import { CustomModal } from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Teamspace } from "@/lib/types";
import { Copy, Crown, Pencil, Plus, Trash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CustomTooltip } from "@/components/CustomTooltip";
import { SearchInput } from "@/components/SearchInput";
import { UserProfile } from "@/components/UserProfile";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user/UserProvider";


interface TeamspaceMemberProps {
  teamspace: Teamspace & { gradient: string };
  refreshTeamspaces: () => void;
}

const InviteModal = ({
  setOpenModal,
  setCloseModal,
  isInviteModalOpen,
  disabled,
  teamspaceId,
  refreshTeamspaces,
}: {
  setOpenModal: () => void;
  setCloseModal: () => void;
  isInviteModalOpen: boolean;
  disabled: boolean;
  teamspaceId: number;
  refreshTeamspaces: () => void;
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const handleInvite = async () => {
    try {
      const response = await fetch(
        `/api/manage/admin/teamspace/user-add/${teamspaceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([email]),
        }
      );

      if (!response.ok) throw new Error("Failed to add user");

      if (role) {
        const roleResponse = await fetch(
          `/api/manage/admin/teamspace/user-role/${teamspaceId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_email: email, new_role: role }),
          }
        );

        if (!roleResponse.ok) throw new Error("Failed to update user role");
      }

      router.refresh()
      refreshTeamspaces()
      toast({
        title: "Success",
        description: "User invited successfully",
        variant: "success",
      });
      setEmail("");
      setRole("");
      setCloseModal();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Error inviting user",
        variant: "destructive",
      });
    }
  };

  return (
    <CustomModal
      trigger={
        <div className="flex justify-end">
          <Button onClick={setOpenModal} disabled={disabled}>
            <Plus size={16} /> Add
          </Button>
        </div>
      }
      title="Invite to Your Teamspace"
      description="Your invite link has been created. Share this link to join your workspace."
      open={isInviteModalOpen}
      onClose={setCloseModal}
    >
      <div className="space-y-4 pt-2">
        <div className="grid gap-1.5">
          <Label className="text-sm font-semibold leading-none">
            Invite user
          </Label>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Select onValueChange={(value) => setRole(value)}>
              <SelectTrigger className="w-full lg:w-64">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Label className="text-sm font-semibold leading-none pt-1.5">
            We’ll send them instructions and a magic link to join the workspace
            via email.
          </Label>
        </div>

        <div className="flex gap-2 justify-end pt-6">
          <Button variant="ghost" onClick={setCloseModal}>
            Cancel
          </Button>
          <Button onClick={handleInvite}>Add User</Button>
        </div>
      </div>
    </CustomModal>
  );
};

export const TeamspaceMember = ({
  teamspace,
  refreshTeamspaces,
}: TeamspaceMemberProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isRemoveUserModalOpen, setIsRemoveUserModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useUser();

  const filteredUsers = teamspace.users.filter((user) =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const usersToDisplay = [
    ...teamspace.users
      .sort((a, b) => (a.id === user?.id ? -1 : b.id === user?.id ? 1 : 0))
  ].slice(0, 8);

  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/manage/admin/teamspace/${teamspace.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_ids: teamspace.users
              .filter((user) => user.id !== userId)
              .map((user) => user.id),
            cc_pair_ids: teamspace.cc_pairs.map((ccPair) => ccPair.id),
            assistant_ids: teamspace.assistants.map((docSet) => docSet.id),
            document_set_ids: teamspace.document_sets.map(
              (documentSet) => documentSet.id
            ),
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to remove user");

      router.refresh();
      refreshTeamspaces();

      toast({
        title: "Success",
        description: "User removed successfully",
        variant: "success",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <CustomModal
        trigger={
          <div
            className={`rounded-md bg-muted w-full p-4 min-h-36 flex flex-col justify-between ${teamspace.is_up_to_date && !teamspace.is_up_for_deletion && "cursor-pointer"}`}
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
                    trigger={
                      <div
                        key={user.id}
                        className={`bg-brand-500 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-inverted text-lg uppercase border-[1px] border-white ${user.email == teamspace.creator.email && "border-red-500"}`}
                      >
                        {user.full_name!.charAt(0)}
                      </div>
                    }
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
        onClose={() => setIsMemberModalOpen(false)}
      >
        {teamspace.users.length > 0 ? (
          <div className="space-y-4">
            <InviteModal
              isInviteModalOpen={isInviteModalOpen}
              setOpenModal={() => setIsInviteModalOpen(true)}
              setCloseModal={() => setIsInviteModalOpen(false)}
              disabled={
                !teamspace.is_up_to_date || teamspace.is_up_for_deletion
              }
              teamspaceId={teamspace.id}
              refreshTeamspaces={refreshTeamspaces}
            />
            <div className="w-1/2 ml-auto">
              <SearchInput
                placeholder="Search users..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {/* <TableHead>
                        <Checkbox />
                      </TableHead> */}
                      <TableHead>Name</TableHead>
                      <TableHead>Email Address</TableHead>
                      {/* <TableHead>Workspace</TableHead> */}
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        {/* <TableCell>
                          <Checkbox />
                        </TableCell> */}
                        <TableCell className="flex items-center gap-2">
                          <UserProfile user={user} size={40} />
                          <div className="grid">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold whitespace-nowrap">
                                {user.full_name}
                              </span>
                              <Badge
                                variant={
                                  user.role === "admin"
                                    ? "success"
                                    : "secondary"
                                }
                              >
                                {user.role.charAt(0).toUpperCase() +
                                  user.role.slice(1)}
                              </Badge>
                            </div>
                            {/* <span className="text-xs">@username</span> */}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.workspace?.workspace_name}</TableCell>
                        <TableCell>
                          <CustomTooltip
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedUserId(user.id); // Set selected user ID
                                  setIsRemoveUserModalOpen(true); // Open modal
                                }}
                              >
                                <Trash size={16} />
                              </Button>
                            }
                            asChild
                            variant="destructive"
                          >
                            Remove
                          </CustomTooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
          "There are no member."
        )}
      </CustomModal>

      {isRemoveUserModalOpen && (
        <CustomModal
          trigger={null}
          title="Remove Member"
          open={isRemoveUserModalOpen}
          onClose={() => setIsRemoveUserModalOpen(false)}
          description="You are about to remove this member."
        >
          <div className="pt-6 flex gap-4 justify-center">
            <Button onClick={() => setIsRemoveUserModalOpen(false)}>No</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedUserId) {
                  handleRemoveUser(selectedUserId); // Use selected user ID
                }
                setIsRemoveUserModalOpen(false);
              }}
            >
              Yes
            </Button>
          </div>
        </CustomModal>
      )}
    </>
  );
};
