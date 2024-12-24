"use client";

import { AdminPageTitle } from "@/components/admin/Title";
import { UserIcon } from "lucide-react";
import Main from "./Main";

const Page = () => {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container">
        <AdminPageTitle title="Manage Users" icon={<UserIcon size={32} />} />
        <Main />
      </div>
    </div>
  );
};

export default Page;
