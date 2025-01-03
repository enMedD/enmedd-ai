import React from "react";
import { Modal } from "@/components/Modal";
import { Button, Text, Callout } from "@tremor/react";
import { CloudEmbeddingProvider } from "../../../../components/embedding/interfaces";
import { CustomModal } from "@/components/CustomModal";

export function DeleteCredentialsModal({
  modelProvider,
  onConfirm,
  onCancel,
  showDeleteCredentialsModal,
}: {
  modelProvider: CloudEmbeddingProvider;
  onConfirm: () => void;
  onCancel: () => void;
  showDeleteCredentialsModal: boolean;
}) {
  return (
    <CustomModal
      title={`Delete ${modelProvider.provider_type} Credentials?`}
      onClose={onCancel}
      trigger={null}
      open={showDeleteCredentialsModal}
    >
      <div className="mb-4">
        <Text className="text-lg mb-2">
          You&apos;re about to delete your {modelProvider.provider_type}{" "}
          credentials. Are you sure?
        </Text>
        <Callout
          title="Point of No Return"
          color="red"
          className="mt-4"
        ></Callout>
        <div className="flex mt-8 justify-between">
          <Button color="gray" onClick={onCancel}>
            Keep Credentaisl
          </Button>
          <Button color="red" onClick={onConfirm}>
            Delete Credentials
          </Button>
        </div>
      </div>
    </CustomModal>
  );
}
