"use client";

import { Modal } from "@/components/Modal";
import { errorHandlingFetcher } from "@/lib/fetcher";
import { useState } from "react";
import useSWR from "swr";
import { Callout } from "@tremor/react";
import { Loading } from "@/components/Loading";
import { FullLLMProvider, WellKnownLLMProviderDescriptor } from "./interfaces";
import { LLMProviderUpdateForm } from "./LLMProviderUpdateForm";
import { LLM_PROVIDERS_ADMIN_URL } from "./constants";
import { CustomLLMProviderUpdateForm } from "./CustomLLMProviderUpdateForm";
import { ConfiguredLLMProviderDisplay } from "./ConfiguredLLMProviderDisplay";
import { Button } from "@/components/ui/button";
import { CustomModal } from "@/components/CustomModal";
import { Card, CardContent } from "@/components/ui/card";

function LLMProviderUpdateModal({
  llmProviderDescriptor,
  onClose,
  existingLlmProvider,
  shouldMarkAsDefault,
}: {
  llmProviderDescriptor: WellKnownLLMProviderDescriptor | null;
  onClose: () => void;
  existingLlmProvider?: FullLLMProvider;
  shouldMarkAsDefault?: boolean;
}) {
  const providerName =
    llmProviderDescriptor?.display_name ||
    llmProviderDescriptor?.name ||
    existingLlmProvider?.name ||
    "Custom LLM Provider";
  return (
    <div>
      {llmProviderDescriptor ? (
        <LLMProviderUpdateForm
          llmProviderDescriptor={llmProviderDescriptor}
          onClose={onClose}
          existingLlmProvider={existingLlmProvider}
          shouldMarkAsDefault={shouldMarkAsDefault}
        />
      ) : (
        <CustomLLMProviderUpdateForm
          onClose={onClose}
          existingLlmProvider={existingLlmProvider}
          shouldMarkAsDefault={shouldMarkAsDefault}
        />
      )}
    </div>
  );
}

function DefaultLLMProviderDisplay({
  llmProviderDescriptor,
  shouldMarkAsDefault,
}: {
  llmProviderDescriptor: WellKnownLLMProviderDescriptor | null;
  shouldMarkAsDefault?: boolean;
}) {
  const [formIsVisible, setFormIsVisible] = useState(false);

  const providerName =
    llmProviderDescriptor?.display_name || llmProviderDescriptor?.name;

  return (
    <div className="flex p-3 border rounded shadow-sm border-border md:w-96">
      <div className="my-auto">
        <div className="font-bold">{providerName} </div>
      </div>

      <div className="ml-auto">
        <CustomModal
          trigger={
            <Button onClick={() => setFormIsVisible(true)}>Set up</Button>
          }
          open={formIsVisible}
          onClose={() => setFormIsVisible(false)}
          title={`Setup ${providerName}`}
        >
          <LLMProviderUpdateModal
            llmProviderDescriptor={llmProviderDescriptor}
            onClose={() => setFormIsVisible(false)}
            shouldMarkAsDefault={shouldMarkAsDefault}
          />
        </CustomModal>
      </div>
    </div>
  );
}

function AddCustomLLMProvider({
  existingLlmProviders,
}: {
  existingLlmProviders: FullLLMProvider[];
}) {
  const [formIsVisible, setFormIsVisible] = useState(false);

  return (
    <CustomModal
      trigger={
        <Button onClick={() => setFormIsVisible(true)}>
          Add Custom LLM Provider
        </Button>
      }
      onClose={() => setFormIsVisible(false)}
      open={formIsVisible}
      title="Setup Custom LLM Provider"
    >
      <div>
        <CustomLLMProviderUpdateForm
          onClose={() => setFormIsVisible(false)}
          shouldMarkAsDefault={existingLlmProviders.length === 0}
        />
      </div>
    </CustomModal>
  );
}

export function LLMConfiguration() {
  const { data: llmProviderDescriptors } = useSWR<
    WellKnownLLMProviderDescriptor[]
  >("/api/admin/llm/built-in/options", errorHandlingFetcher);
  const { data: existingLlmProviders } = useSWR<FullLLMProvider[]>(
    LLM_PROVIDERS_ADMIN_URL,
    errorHandlingFetcher
  );

  if (!llmProviderDescriptors || !existingLlmProviders) {
    return <Loading />;
  }

  return (
    <>
      <h3 className="pb-1.5">Enabled LLM Providers</h3>

      {existingLlmProviders.length > 0 ? (
        <>
          <p className="pb-4 text-sm">
            If multiple LLM providers are enabled, the default provider will be
            used for all &quot;Default&quot; Assistants. For user-created
            Assistants, you can select the LLM provider/model that best fits the
            use case
          </p>
          <ConfiguredLLMProviderDisplay
            existingLlmProviders={existingLlmProviders}
            llmProviderDescriptors={llmProviderDescriptors}
          />
        </>
      ) : (
        <Card className="flex border rounded shadow-sm border-border md:w-96">
          <CardContent className="p-3">
            <h3>No LLM providers configured yet</h3>
            <p className="text-subtle text-sm pt-2">
              Please set one up below in order to start using Arnold AI
            </p>
          </CardContent>
        </Card>
      )}

      <h3 className="pb-1.5 pt-6">Add LLM Provider</h3>
      <p className="pb-4 text-sm">
        Add a new LLM provider by either selecting from one of the default
        providers or by specifying your own custom LLM provider.
      </p>

      <div className="flex flex-col gap-y-4">
        {llmProviderDescriptors.map((llmProviderDescriptor) => {
          return (
            <DefaultLLMProviderDisplay
              key={llmProviderDescriptor.name}
              llmProviderDescriptor={llmProviderDescriptor}
              shouldMarkAsDefault={existingLlmProviders.length === 0}
            />
          );
        })}
      </div>

      <div className="mt-10">
        <AddCustomLLMProvider existingLlmProviders={existingLlmProviders} />
      </div>
    </>
  );
}
