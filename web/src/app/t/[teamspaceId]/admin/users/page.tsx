"use client";

import { AdminPageTitle } from "@/components/admin/Title";
import { AllUsers } from "@/app/admin/users/AllUsers";
import { useParams } from "next/navigation";
import { UserIcon } from "lucide-react";
import { PendingInvites } from "@/app/admin/users/PedingInvites";
import { Separator } from "@/components/ui/separator";
import Main from "@/app/admin/users/Main";

const Page = () => {
  const { teamspaceId } = useParams();

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container">
        <AdminPageTitle title="Manage Users" icon={<UserIcon size={32} />} />
        <Main teamspaceId={teamspaceId} />
      </div>
    </div>
  );
};

export default Page;
