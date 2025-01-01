import { ConnectorCredentialPairStatus } from "@/app/admin/connector/[ccPairId]/types";
import { DATA_SOURCE_ERROR_MESSAGES } from "@/constants/error";
import { DATA_SOURCE_SUCCESS_MESSAGES } from "@/constants/success";
import { useToast } from "@/hooks/use-toast";

export async function setCCPairStatus(
  ccPairId: number,
  ccPairStatus: ConnectorCredentialPairStatus,
  onUpdate?: () => void
) {
  const { toast } = useToast();

  try {
    const response = await fetch(
      `/api/manage/admin/cc-pair/${ccPairId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: ccPairStatus }),
      }
    );

    if (!response.ok) {
      const { detail } = await response.json();
      console.error("Error updating CC pair status:", detail);
      toast({
        title: DATA_SOURCE_ERROR_MESSAGES.UPDATE_STATUS.title,
        description: DATA_SOURCE_ERROR_MESSAGES.UPDATE_STATUS.description,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: DATA_SOURCE_SUCCESS_MESSAGES.UPDATE_STATUS.title,
      description: DATA_SOURCE_SUCCESS_MESSAGES.UPDATE_STATUS.description(
        ccPairStatus === ConnectorCredentialPairStatus.ACTIVE
      ),
      variant: "success",
    });

    if (onUpdate) onUpdate();
  } catch (error) {
    console.error("Error updating CC pair status:", error);
    toast({
      title: DATA_SOURCE_ERROR_MESSAGES.UPDATE_STATUS.title,
      description: DATA_SOURCE_ERROR_MESSAGES.UPDATE_STATUS.description,
      variant: "destructive",
    });
  }
}
