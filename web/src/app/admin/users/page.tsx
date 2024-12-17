"use client";

import { AdminPageTitle } from "@/components/admin/Title";
import { AllUsers } from "./AllUsers";
import { PendingInvites } from "./PedingInvites";
import { Separator } from "@/components/ui/separator";
import { UserIcon } from "lucide-react";

const Page = () => {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container">
        <AdminPageTitle title="Manage Users" icon={<UserIcon size={32} />} />
        <div className="pb-20 w-full">
          <AllUsers />
          <Separator className="my-10" />
          <PendingInvites />
        </div>
      </div>
    </div>
  );
};

export default Page;
