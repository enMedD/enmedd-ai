"use client";

import { AdminPageTitle } from "@/components/admin/Title";
import { AllUsers } from "@/app/admin/users/AllUsers";
import { useParams } from "next/navigation";
import { UserIcon } from "lucide-react";
import { PendingInvites } from "@/app/admin/users/PedingInvites";
import { Separator } from "@/components/ui/separator";

const Page = () => {
  const { teamspaceId } = useParams();

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container">
        <AdminPageTitle title="Manage Users" icon={<UserIcon size={32} />} />
        <div className="pb-20 w-full">
          <AllUsers teamspaceId={teamspaceId} />
          <Separator className="my-10" />
          <PendingInvites teamspaceId={teamspaceId} />
        </div>
      </div>
    </div>
  );
};

export default Page;
