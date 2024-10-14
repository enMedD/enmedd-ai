import { AdminPageTitle } from "@/components/admin/Title";
import { ZoomInIcon } from "@/components/icons/icons";
import { Explorer } from "./Explorer";
import { fetchValidFilterInfo } from "@/lib/search/utilsSS";
import { ZoomIn } from "lucide-react";

const Page = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) => {
  const { connectors, documentSets } = await fetchValidFilterInfo();

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container">
        <AdminPageTitle icon={<ZoomIn size={32} />} title="Document Explorer" />

        <Explorer
          initialSearchValue={searchParams.query}
          connectors={connectors}
          documentSets={documentSets}
        />
      </div>
    </div>
  );
};

export default Page;
