/* import { CustomModal } from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Teamspace } from "@/lib/types";
import { Copy, Plus } from "lucide-react";

interface TeamspaceMemberProps {
  teamspace: Teamspace & { gradient: string };
}

export const TeamspaceMember = ({ teamspace }: TeamspaceMemberProps) => {
  return (
    <CustomModal
      title="Members"
      trigger={
        <div className="rounded-md bg-muted w-full p-4 min-h-32 flex flex-col justify-between cursor-pointer">
          <div className="flex items-center justify-between">
            <h3 className="md:text-lg">
              Members <span className="px-2">|</span> {teamspace.users.length}
            </h3>
            <CustomModal
              trigger={
                <Button>
                  <Plus size={16} /> Invite
                </Button>
              }
              title="Invite to Your Teamspace"
              description="Your invite link has been created. Share this link to join
            your workspace."
            >
              <div className="space-y-4">
                <div>
                  <Label>Share link</Label>
                  <div className="flex items-center gap-2">
                    <Input />
                    <Button variant="outline" size="icon">
                      <Copy />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Invite user</Label>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Enter email" />
                    <Select>
                      <SelectTrigger className="w-full lg:w-64">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Label className="pt-1.5">
                    We&rsquo;ll send them instructions and a magic link to join
                    the workspace via email.
                  </Label>
                </div>

                <div className="flex gap-2 justify-end pt-6">
                  <Button variant="ghost">Cancel</Button>
                  <Button>Send Invite</Button>
                </div>
              </div>
            </CustomModal>
          </div>

          {teamspace.users.length > 0 ? (
            <div className="pt-4 flex flex-wrap -space-x-3">
              {teamspace.users.map((teamspace, i) => (
                <div
                  key={i}
                  className={`bg-primary w-10 h-10 rounded-full flex items-center justify-center font-semibold text-inverted text-lg`}
                >
                  {teamspace.full_name!.charAt(0)}
                </div>
              ))}
              {teamspace.users.length > 4 && (
                <div className="bg-background w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">
                  +{teamspace.users.length - 4}
                </div>
              )}
            </div>
          ) : (
            <p>There are no members.</p>
          )}
        </div>
      }
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Checkbox />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead>Team</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamspace.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.status}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{teamspace.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </CustomModal>
  );
}; */
import { CustomModal } from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Teamspace } from "@/lib/types";
import { Copy, Plus } from "lucide-react";

interface TeamspaceMemberProps {
  teamspace: Teamspace & { gradient: string };
}

export const TeamspaceMember = ({ teamspace }: TeamspaceMemberProps) => {
  return (
    <div className="rounded-md bg-muted w-full p-4 min-h-32 flex flex-col justify-between cursor-pointer">
      <div className="flex items-center justify-between">
        <h3 className="md:text-lg">
          Members <span className="px-2">|</span> {teamspace.users.length}
        </h3>
        <CustomModal
          trigger={
            <Button>
              <Plus size={16} /> Invite
            </Button>
          }
          title="Invite to Your Teamspace"
          description="Your invite link has been created. Share this link to join
            your workspace."
        >
          <div className="space-y-4">
            <div>
              <Label>Share link</Label>
              <div className="flex items-center gap-2">
                <Input />
                <Button variant="outline" size="icon">
                  <Copy />
                </Button>
              </div>
            </div>

            <div>
              <Label>Invite user</Label>
              <div className="flex items-center gap-2">
                <Input placeholder="Enter email" />
                <Select>
                  <SelectTrigger className="w-full lg:w-64">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Label className="pt-1.5">
                We&rsquo;ll send them instructions and a magic link to join the
                workspace via email.
              </Label>
            </div>

            <div className="flex gap-2 justify-end pt-6">
              <Button variant="ghost">Cancel</Button>
              <Button>Send Invite</Button>
            </div>
          </div>
        </CustomModal>
      </div>

      {teamspace.users.length > 0 ? (
        <div className="pt-4 flex flex-wrap -space-x-3">
          {teamspace.users.map((teamspace, i) => (
            <div
              key={i}
              className={`bg-primary w-10 h-10 rounded-full flex items-center justify-center font-semibold text-inverted text-lg`}
            >
              {teamspace.full_name!.charAt(0)}
            </div>
          ))}
          {teamspace.users.length > 4 && (
            <div className="bg-background w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">
              +{teamspace.users.length - 4}
            </div>
          )}
        </div>
      ) : (
        <p>There are no members.</p>
      )}
    </div>
  );
};
