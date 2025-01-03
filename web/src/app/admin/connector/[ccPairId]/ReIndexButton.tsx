"use client";

import { PopupSpec, usePopup } from "@/components/admin/connectors/Popup";
import { runConnector } from "@/lib/connector";
import { mutate } from "swr";
import { buildCCPairInfoUrl } from "./lib";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { useToast } from "@/hooks/use-toast";
import { Divider } from "@/components/Divider";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Button } from "@/components/ui/button";
import { CustomModal } from "@/components/CustomModal";
import { DATA_SOURCE_ERROR_MESSAGES } from "@/constants/toast/error";
import { DATA_SOURCE_SUCCESS_MESSAGES } from "@/constants/toast/success";

function ReIndexPopup({
  connectorId,
  credentialId,
  ccPairId,
  hide,
  reIndexPopupVisible,
}: {
  connectorId: number;
  credentialId: number;
  ccPairId: number;
  hide: () => void;
  reIndexPopupVisible: boolean;
}) {
  const { toast } = useToast();
  async function triggerIndexing(fromBeginning: boolean) {
    const errorMsg = await runConnector(
      connectorId,
      [credentialId],
      fromBeginning
    );
    if (errorMsg) {
      toast({
        title: DATA_SOURCE_ERROR_MESSAGES.CONNECTOR_RUN.title,
        description:
          DATA_SOURCE_ERROR_MESSAGES.CONNECTOR_RUN.description(errorMsg),
        variant: "destructive",
      });
    } else {
      toast({
        title: DATA_SOURCE_SUCCESS_MESSAGES.CONNECTOR_RUN.title,
        description: DATA_SOURCE_SUCCESS_MESSAGES.CONNECTOR_RUN.description,
        variant: "success",
      });
    }
    mutate(buildCCPairInfoUrl(ccPairId));
  }

  return (
    <CustomModal
      title="Run Indexing"
      onClose={hide}
      trigger={null}
      open={reIndexPopupVisible}
    >
      <div>
        <Button
          className="ml-auto"
          onClick={() => {
            triggerIndexing(false);
            hide();
          }}
        >
          Run Update
        </Button>

        <p className="mt-2">
          This will pull in and index all documents that have changed and/or
          have been added since the last successful indexing run.
        </p>

        <Divider />

        <Button
          className="ml-auto"
          onClick={() => {
            triggerIndexing(true);
            hide();
          }}
        >
          Run Complete Re-Indexing
        </Button>

        <p className="mt-2">
          This will cause a complete re-indexing of all documents from the
          source.
        </p>

        <p className="mt-2">
          <b>NOTE:</b> depending on the number of documents stored in the
          source, this may take a long time.
        </p>
      </div>
    </CustomModal>
  );
}

export function ReIndexButton({
  ccPairId,
  connectorId,
  credentialId,
  isDisabled,
  isDeleting,
}: {
  ccPairId: number;
  connectorId: number;
  credentialId: number;
  isDisabled: boolean;
  isDeleting: boolean;
}) {
  const [reIndexPopupVisible, setReIndexPopupVisible] = useState(false);
  return (
    <>
      {reIndexPopupVisible && (
        <ReIndexPopup
          connectorId={connectorId}
          credentialId={credentialId}
          ccPairId={ccPairId}
          hide={() => setReIndexPopupVisible(false)}
          reIndexPopupVisible={reIndexPopupVisible}
        />
      )}
      {isDeleting || isDisabled ? (
        <CustomTooltip
          trigger={
            <Button
              className="ml-auto"
              onClick={() => {
                setReIndexPopupVisible(true);
              }}
              disabled={isDisabled || isDeleting}
              variant="outline"
            >
              Index
            </Button>
          }
          asChild
        >
          <Button
            className="ml-auto"
            onClick={() => {
              setReIndexPopupVisible(true);
            }}
            disabled={isDisabled || isDeleting}
          >
            {isDeleting
              ? "Cannot index while connector is deleting"
              : isDisabled
                ? "Connector must be re-enabled before indexing"
                : undefined}
          </Button>
        </CustomTooltip>
      ) : (
        <Button
          className="ml-auto"
          onClick={() => {
            setReIndexPopupVisible(true);
          }}
          disabled={isDisabled || isDeleting}
        >
          Index
        </Button>
      )}
    </>
  );
}
