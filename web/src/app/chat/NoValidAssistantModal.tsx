"use client";

import { CustomModal } from "@/components/CustomModal";
import { Assistant } from "../admin/assistants/interfaces";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function NoValidAssistantModal({
  assistants,
  teamspaceId,
  isTeamspaceAdmin = false,
}: {
  assistants: Assistant[];
  teamspaceId: string | undefined;
  isTeamspaceAdmin: boolean;
}) {
  const basicUserDescription = `
    Currently, there is no valid assistant assigned to this teamspace. This means the chat feature is unavailable for now. 
    The teamspace may still be syncing, or no assistant has been assigned yet. Please check back later, or reach out to the teamspace administrator for more details.
  `;

  const adminDescription = `
    There is currently no valid assistant assigned to this teamspace, so the chat page cannot be used. This may be because the teamspace is still syncing, or an assistant has not been assigned yet. As an administrator, you can visit the admin panel to review the teamspace status and assign an assistant. 
  `;

  return (
    <CustomModal
      trigger={null}
      title="No valid assistant for this teamspace"
      open={!assistants || assistants.length === 0}
      description={isTeamspaceAdmin ? adminDescription : basicUserDescription}
    >
      <div className="flex gap-2 justify-end">
        <Link href="/chat" passHref>
          <Button>Go back to Workspace</Button>
        </Link>

        {isTeamspaceAdmin && (
          <Link
            href={
              teamspaceId
                ? `/t/${teamspaceId}/admin/indexing/status`
                : `/admin/indexing/status`
            }
            passHref
          >
            <Button>Go to Teamspace Admin Panel</Button>
          </Link>
        )}

        <Link href={`/t/${teamspaceId}/search`} passHref>
          <Button>Go to Search</Button>
        </Link>
      </div>
    </CustomModal>
  );
}
