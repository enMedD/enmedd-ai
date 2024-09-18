import { AdminPageTitle } from "@/components/admin/Title";
import { fetchSS } from "@/lib/utilsSS";
import { Assistant } from "@/app/admin/assistants/interfaces";
import { ErrorCallout } from "@/components/ErrorCallout";
import { GroupsIcon } from "@/components/icons/icons";
import { Main } from "./Main";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

export default async function Page() {
  const assistantResponse = await fetchSS("/admin/assistant");

  if (!assistantResponse.ok) {
    return (
      <ErrorCallout
        errorTitle="Something went wrong :("
        errorMsg={`Failed to fetch assistants - ${await assistantResponse.text()}`}
      />
    );
  }

  const assistants = (await assistantResponse.json()) as Assistant[];

  return (
    <div className="container">
      {/*  <AdminPageTitle
        title="Manage Teamspaces"
        icon={<GroupsIcon size={32} />}
      /> */}
      {/*     <div className="flex justify-between items-center">
        <h1 className="font-bold text-xl md:text-[28px]">Team Space</h1>
        <Button>
          <div className="flex items-center">
            <Users />
            <Plus size={14} className="-ml-0.5" strokeWidth={4} />
          </div>
          Create team
        </Button>
      </div> */}

      <Main assistants={assistants} />
    </div>
  );
}
