"use client";

import { ApiKeyForm } from "./ApiKeyForm";
import { useProviderStatus } from "../chat_search/ProviderContext";
import { PopupSpec } from "../admin/connectors/Popup";
import { WellKnownLLMProviderDescriptor } from "@/app/admin/models/llm/interfaces";
import { checkLlmProvider } from "../initialSetup/welcome/lib";
import { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { CustomModal } from "../CustomModal";
import { useState } from "react";

export const ApiKeyModal = ({
  hide,
  setPopup,
}: {
  hide: () => void;
  setPopup: (popup: PopupSpec) => void;
}) => {
  const router = useRouter();

  const [forceHidden, setForceHidden] = useState<boolean>(false);

  const {
    shouldShowConfigurationNeeded,
    providerOptions,
    refreshProviderInfo,
  } = useProviderStatus();

  if (!shouldShowConfigurationNeeded) {
    return null;
  }

  return (
    <CustomModal
      open={!forceHidden}
      onClose={() => setForceHidden(true)}
      trigger={null}
      title="Set an API Key"
    >
      <div>
        <div className="mb-5 text-sm">
          Please provide an API Key below in order to start using enMedD AI. You
          can always change this later.
          <br />
          Or if you&apos;d rather look around first,{" "}
          <strong
            onClick={() => setForceHidden(true)}
            className="text-link cursor-pointer"
          >
            skip this step
          </strong>
          .
        </div>

        <ApiKeyForm
          setPopup={setPopup}
          onSuccess={() => {
            router.refresh();
            refreshProviderInfo();
            hide();
          }}
          providerOptions={providerOptions}
        />
      </div>
    </CustomModal>
  );
};
