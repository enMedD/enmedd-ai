import { TeamspaceUpdate } from "../types";

export const updateTeamspace = async (
  groupId: number,
  teamspace: TeamspaceUpdate
) => {
  const url = `/api/manage/admin/teamspace/${groupId}`;
  return await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(teamspace),
  });
};
