"use client";

import { CustomModal } from "@/components/CustomModal";
import { Assistant } from "../admin/assistants/interfaces";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function NoValidAssistantModal({
  assistants,
  teamspaceId,
  isTeamspaceAdmin = false,
  isAdmin = false,
}: {
  assistants: Assistant[];
  teamspaceId: string | undefined;
  isTeamspaceAdmin: boolean;
  isAdmin: boolean;
}) {
  const hasNoValidAssistant = !assistants || assistants.length === 0;

  const descriptions = {
    basicWorkspaceUser: `
      Currently, there is no valid assistant assigned to this workspace. This means the chat feature is unavailable for now. 
      The workspace may still be syncing, or no assistant has been assigned yet. Please check back later, or reach out to the workspace administrator for more details.
    `,
    workspaceAdmin: `
      There is currently no valid assistant assigned to this workspace, so the chat page cannot be used. This may be because the workspace is still syncing, or an assistant has not been assigned yet. As an administrator, you can visit the admin panel to review the workspace status and assign an assistant.
    `,
    basicTeamspaceUser: `
      Currently, there is no valid assistant assigned to this teamspace. This means the chat feature is unavailable for now. 
      The teamspace may still be syncing, or no assistant has been assigned yet. Please check back later, or reach out to the teamspace administrator for more details.
    `,
    teamspaceAdmin: `
      There is currently no valid assistant assigned to this teamspace, so the chat page cannot be used. This may be because the teamspace is still syncing, or an assistant has not been assigned yet. As an administrator, you can visit the admin panel to review the teamspace status and assign an assistant.
    `,
  };

  const getDescription = () => {
    if (isTeamspaceAdmin) return descriptions.teamspaceAdmin;
    if (isAdmin) return descriptions.workspaceAdmin;
    return teamspaceId
      ? descriptions.basicTeamspaceUser
      : descriptions.basicWorkspaceUser;
  };

  const getLinks = () => {
    const links = [
      { condition: teamspaceId, href: "/chat", label: "Go back to Workspace" },
      {
        condition: isTeamspaceAdmin && teamspaceId,
        href: `/t/${teamspaceId}/admin/indexing/status`,
        label: "Go to Teamspace Admin Panel",
      },
      {
        condition: isAdmin && !teamspaceId,
        href: "/admin/indexing/status",
        label: "Go to Workspace Admin Panel",
      },
      {
        condition: true,
        href: teamspaceId ? `/t/${teamspaceId}/search` : "/search",
        label: "Go to Search",
      },
    ];

    return links
      .filter((link) => link.condition)
      .map((link) => (
        <Link key={link.href} href={link.href} passHref>
          <Button>{link.label}</Button>
        </Link>
      ));
  };

  return (
    <CustomModal
      trigger={null}
      title={`No valid assistant for this ${teamspaceId ? "teamspace" : "workspace"}`}
      open={hasNoValidAssistant}
      description={getDescription()}
    >
      <div className="flex gap-2 justify-end">{getLinks()}</div>
    </CustomModal>
  );
}
