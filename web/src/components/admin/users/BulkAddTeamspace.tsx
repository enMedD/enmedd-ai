import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useTeamspaceUsers } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const BulkAddTeamspace = ({
  teamspaceId,
  refreshUsers,
  onClose,
}: {
  teamspaceId?: string | string[];
  refreshUsers: () => void;
  onClose: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  const router = useRouter();
  const { toast } = useToast();
  const { data: users, refreshTeamspaceUsers } = useTeamspaceUsers(teamspaceId);

  const handleInvite = async () => {
    if (selectedEmails.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select users to invite.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/manage/admin/teamspace/user-add/${teamspaceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selectedEmails),
        }
      );

      if (!response.ok) throw new Error("Failed to add users");

      refreshTeamspaceUsers();
      refreshUsers();
      onClose();
      router.refresh();
      toast({
        title: "Success",
        description: "Users invited successfully",
        variant: "success",
      });
      setSelectedEmails([]);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Error inviting users",
        variant: "destructive",
      });
    }
  };

  const handleCheckboxChange = (email: string) => {
    setSelectedEmails((prevSelected) =>
      prevSelected.includes(email)
        ? prevSelected.filter((e) => e !== email)
        : [...prevSelected, email]
    );
  };

  const filteredUsers = users?.filter(
    (user) =>
      user.full_name!.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center mt-4 gap-x-2 w-full md:w-1/2 ml-auto mb-6">
        <Input
          type="text"
          placeholder="Search user"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Button onClick={handleInvite}>Add</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((user) => (
                <TableRow key={user.email}>
                  <TableCell>
                    <Checkbox
                      checked={selectedEmails.includes(user.email)}
                      onCheckedChange={() => handleCheckboxChange(user.email)}
                    />
                  </TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};