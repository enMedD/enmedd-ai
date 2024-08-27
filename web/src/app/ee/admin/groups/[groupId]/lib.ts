import { TeamspaceUpdate } from "../types";

export const updateTeamspace = async (
  teamspaceId: number,
  teamspace: TeamspaceUpdate
) => {
  const url = `/api/manage/admin/teamspace/${teamspaceId}`;
  return await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(teamspace),
  });
};
