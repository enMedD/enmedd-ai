import { PopupSpec } from "@/components/admin/connectors/Popup";
import { DeletionAttemptSnapshot } from "./types";
import { toast } from "@/hooks/use-toast";
import { DATA_SOURCE_SUCCESS_MESSAGES } from "@/constants/toast/success";
import {
  DATA_SOURCE_ERROR_MESSAGES,
  GLOBAL_ERROR_MESSAGES,
  OPERATION_ERROR_MESSAGES,
} from "@/constants/toast/error";

export async function scheduleDeletionJobForConnector(
  connectorId: number,
  credentialId: number
) {
  // Will schedule a background job which will:
  // 1. Remove all documents indexed by the connector / credential pair
  // 2. Remove the connector (if this is the only pair using the connector)
  const response = await fetch(`/api/manage/admin/deletion-attempt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      connector_id: connectorId,
      credential_id: credentialId,
    }),
  });
  if (response.ok) {
    return null;
  }
  return (await response.json()).detail;
}

export async function deleteCCPair(
  connectorId: number,
  credentialId: number,
  onCompletion: () => void
) {
  const deletionScheduleError = await scheduleDeletionJobForConnector(
    connectorId,
    credentialId
  );
  if (deletionScheduleError) {
    toast({
      title: DATA_SOURCE_ERROR_MESSAGES.SCHEDULED_REMOVE.title,
      description: DATA_SOURCE_ERROR_MESSAGES.SCHEDULED_REMOVE.description(
        deletionScheduleError
      ),
      variant: "destructive",
    });
  } else {
    toast({
      title: DATA_SOURCE_SUCCESS_MESSAGES.SCHEDULED_REMOVE.title,
      description: DATA_SOURCE_SUCCESS_MESSAGES.SCHEDULED_REMOVE.description,
      variant: "success",
    });
  }
  onCompletion();
}

export function isCurrentlyDeleting(
  deletionAttempt: DeletionAttemptSnapshot | null
) {
  if (!deletionAttempt) {
    return false;
  }

  return (
    deletionAttempt.status === "PENDING" || deletionAttempt.status === "STARTED"
  );
}

export const removeCCPair = async (
  id: number,
  teamspaceId: string | string[]
) => {
  try {
    const response = await fetch(
      `/api/manage/admin/teamspace/connector-remove/${teamspaceId}?cc_pair_id=${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      toast({
        title: DATA_SOURCE_SUCCESS_MESSAGES.DELETE.title,
        description: DATA_SOURCE_SUCCESS_MESSAGES.DELETE.description,
        variant: "success",
      });
    } else {
      const errorData = await response.json();
      toast({
        title: OPERATION_ERROR_MESSAGES.ACTION.title("Connector Removal"),
        description: OPERATION_ERROR_MESSAGES.ACTION.description(
          "connector",
          "removing",
          errorData.detail
        ),
        variant: "destructive",
      });
    }
  } catch (error) {
    console.log(error);
    toast({
      title: GLOBAL_ERROR_MESSAGES.UNKNOWN.title,
      description: GLOBAL_ERROR_MESSAGES.UNKNOWN.description,
      variant: "destructive",
    });
  }
};
