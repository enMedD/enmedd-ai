import { useTeamspaces } from "@/lib/hooks";

export const useSpecificTeamspace = (teamspaceId: string) => {
  const { data, isLoading, error, refreshTeamspaces } = useTeamspaces();
  const teamspace = data?.find(
    (teamspace) => teamspace.id.toString() === teamspaceId
  );
  return {
    teamspace,
    isLoading,
    error,
    refreshTeamspace: refreshTeamspaces,
  };
};
