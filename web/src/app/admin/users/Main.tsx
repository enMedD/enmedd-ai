import { Separator } from "@/components/ui/separator";
import { AllUsers } from "./AllUsers";
import { PendingInvites } from "./PedingInvites";
import { errorHandlingFetcher } from "@/lib/fetcher";
import useSWR from "swr";

const Main = ({ teamspaceId }: { teamspaceId?: string | string[] }) => {
  const {
    data: validDomains,
    isLoading: isLoadingDomains,
    error: domainsError,
  } = !teamspaceId
    ? useSWR<string[]>("/api/manage/admin/valid-domains", errorHandlingFetcher)
    : { data: [], isLoading: false, error: null };

  return (
    <div className="pb-20 w-full">
      <AllUsers
        teamspaceId={teamspaceId}
        isLoadingDomains={isLoadingDomains}
        validDomains={validDomains}
        domainsError={domainsError}
      />
      <Separator className="my-10" />
      <PendingInvites
        teamspaceId={teamspaceId}
        isLoadingDomains={isLoadingDomains}
      />
    </div>
  );
};

export default Main;
