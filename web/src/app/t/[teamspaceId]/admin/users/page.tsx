"use client";
import { useState } from "react";
import { AdminPageTitle } from "@/components/admin/Title";
import { UsersIcon } from "@/components/icons/icons";
import { AllUsers } from "./AllUsers";
import { PendingInvites } from "./PedingInvites";
import { Separator } from "@/components/ui/separator";

const ValidDomainsDisplay = ({ validDomains }: { validDomains: string[] }) => {
  if (!validDomains.length) {
    return (
      <div className="text-sm">
        No invited users. Anyone can sign up with a valid email address. To
        restrict access you can:
        <div className="flex flex-wrap mt-1 ml-2">
          (1) Invite users above. Once a user has been invited, only emails that
          have explicitly been invited will be able to sign-up.
        </div>
        <div className="mt-1 ml-2">
          (2) Set the{" "}
          <b className="font-mono w-fit h-fit">VALID_EMAIL_DOMAINS</b>{" "}
          environment variable to a comma separated list of email domains. This
          will restrict access to users with email addresses from these domains.
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm">
      No invited users. Anyone with an email address with any of the following
      domains can sign up: <i>{validDomains.join(", ")}</i>.
      <div className="mt-2">
        To further restrict access you can invite users above. Once a user has
        been invited, only emails that have explicitly been invited will be able
        to sign-up.
      </div>
    </div>
  );
};

const SearchableTables = () => {
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");

  return (
    <div className="pb-20 w-full">
      <AllUsers q={q} />
      <Separator className="my-10" />
      <PendingInvites q={q} />
    </div>
  );
};

const Page = () => {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container">
        <AdminPageTitle title="Manage Users" icon={<UsersIcon size={32} />} />
        <SearchableTables />
      </div>
    </div>
  );
};

export default Page;
