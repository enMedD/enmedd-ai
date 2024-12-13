import { AdminPageTitle } from "@/components/admin/Title";
import { Wrench } from "lucide-react";
import { Main } from "./Main";

export default async function Page() {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container">
        <AdminPageTitle
          icon={<Wrench size={32} className="my-auto" />}
          title="Tools"
        />
        <Main />
      </div>
    </div>
  );
}
