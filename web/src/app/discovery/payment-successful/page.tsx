import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PartyPopper } from "lucide-react";

export default function Page() {
  return (
    <div className="container">
      <div className="mt-12 space-y-2">
        <div className="flex items-center justify-center">
          <div className="bg-brand-500 p-3 rounded-md">
            <PartyPopper size={60} stroke="white" />
          </div>
        </div>
        <h1 className="text-center font-bold text-4xl pt-4">
          Payment Successful!
        </h1>
        <p className="text-center">
          Thank you for your purchase! Your payment has been processed
          successfully
        </p>
      </div>

      <div className="w-3/5 pt-10 mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-end pb-2">
              <Button variant="link" className="p-0 h-fit">
                Skip for now
              </Button>
            </div>
            <CardTitle>Invite people to Arnold AI&apos;s workspace</CardTitle>
            <CardDescription>
              Maximize the benefits of Requestly by inviting your teammates.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div>
              <Label className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5">
                Invite members
              </Label>
              <div className="flex gap-2">
                <Input placeholder="Email" />
                <Select>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button>Add member</Button>
              </div>
              <p className="text-xs pt-1.5 text-subtle">
                This users will be added to Arnold AI&apos;s workspace.
              </p>
            </div>

            <div className="pt-4">
              <Label className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5">
                Invite link
              </Label>
              <div className="flex gap-2">
                <Input placeholder="Invite Link" value="Invite Link" />
                <Select>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button>Copy link</Button>
              </div>
              <p className="text-xs pt-1.5 text-subtle">
                You can <a>reset the link</a>. This will generate a new invite
                link and disable the old one.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="pt-6 flex justify-end">
          <Button>Next</Button>
        </div>
      </div>
    </div>
  );
}
