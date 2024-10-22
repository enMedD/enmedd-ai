import { LoadingAnimation } from "@/components/Loading";
import { Text } from "@tremor/react";
import { Form, Formik } from "formik";
import { LLM_PROVIDERS_ADMIN_URL } from "./constants";
import {
  SelectorFormField,
  TextFormField,
} from "@/components/admin/connectors/Field";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { FullLLMProvider, WellKnownLLMProviderDescriptor } from "./interfaces";
import * as Yup from "yup";
import isEqual from "lodash/isEqual";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LLMProviderUpdateForm({
  llmProviderDescriptor,
  onClose,
  existingLlmProvider,
  shouldMarkAsDefault,
}: {
  llmProviderDescriptor: WellKnownLLMProviderDescriptor;
  onClose: () => void;
  existingLlmProvider?: FullLLMProvider;
  shouldMarkAsDefault?: boolean;
}) {
  const { mutate } = useSWRConfig();
  const { toast } = useToast();

  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState<string>("");

  // Define the initial values based on the provider's requirements
  const initialValues = {
    name: existingLlmProvider?.name ?? "",
    api_key: existingLlmProvider?.api_key ?? "",
    api_base: existingLlmProvider?.api_base ?? "",
    api_version: existingLlmProvider?.api_version ?? "",
    default_model_name:
      existingLlmProvider?.default_model_name ??
      (llmProviderDescriptor.default_model ||
        llmProviderDescriptor.llm_names[0]),
    fast_default_model_name:
      existingLlmProvider?.fast_default_model_name ??
      (llmProviderDescriptor.default_fast_model || null),
    custom_config:
      existingLlmProvider?.custom_config ??
      llmProviderDescriptor.custom_config_keys?.reduce(
        (acc, customConfigKey) => {
          acc[customConfigKey.name] = "";
          return acc;
        },
        {} as { [key: string]: string }
      ),
  };

  const [validatedConfig, setValidatedConfig] = useState(
    existingLlmProvider ? initialValues : null
  );

  // Setup validation schema if required
  const validationSchema = Yup.object({
    name: Yup.string().required("Display Name is required"),
    api_key: llmProviderDescriptor.api_key_required
      ? Yup.string().required("API Key is required")
      : Yup.string(),
    api_base: llmProviderDescriptor.api_base_required
      ? Yup.string().required("API Base is required")
      : Yup.string(),
    api_version: llmProviderDescriptor.api_version_required
      ? Yup.string().required("API Version is required")
      : Yup.string(),
    ...(llmProviderDescriptor.custom_config_keys
      ? {
          custom_config: Yup.object(
            llmProviderDescriptor.custom_config_keys.reduce(
              (acc, customConfigKey) => {
                if (customConfigKey.is_required) {
                  acc[customConfigKey.name] = Yup.string().required(
                    `${customConfigKey.name} is required`
                  );
                }
                return acc;
              },
              {} as { [key: string]: Yup.StringSchema }
            )
          ),
        }
      : {}),
    default_model_name: Yup.string().required("Model name is required"),
    fast_default_model_name: Yup.string().nullable(),
  });

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setSubmitting(true);

        // test the configuration
        if (!isEqual(values, initialValues)) {
          setIsTesting(true);

          const response = await fetch("/api/admin/llm/test", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              provider: llmProviderDescriptor.name,
              ...values,
            }),
          });
          setIsTesting(false);

          if (!response.ok) {
            const errorMsg = (await response.json()).detail;
            setTestError(errorMsg);
            return;
          }
        }

        const response = await fetch(LLM_PROVIDERS_ADMIN_URL, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider: llmProviderDescriptor.name,
            ...values,
            fast_default_model_name:
              values.fast_default_model_name || values.default_model_name,
          }),
        });

        if (!response.ok) {
          const errorMsg = (await response.json()).detail;
          const action = existingLlmProvider ? "update" : "enable";
          const fullErrorMsg = `Unable to ${action} the provider: ${errorMsg}`;

          toast({
            title: "Provider Action Failed",
            description: fullErrorMsg,
            variant: "destructive",
          });
          return;
        }

        if (shouldMarkAsDefault) {
          const newLlmProvider = (await response.json()) as FullLLMProvider;
          const setDefaultResponse = await fetch(
            `${LLM_PROVIDERS_ADMIN_URL}/${newLlmProvider.id}/default`,
            {
              method: "POST",
            }
          );
          if (!setDefaultResponse.ok) {
            const errorMsg = (await setDefaultResponse.json()).detail;
            const fullErrorMsg = `Could not set "${newLlmProvider.name}" as the default provider: ${errorMsg}`;

            toast({
              title: "Default Provider Update Failed",
              description: fullErrorMsg,
              variant: "destructive",
            });
            return;
          }
        }

        mutate(LLM_PROVIDERS_ADMIN_URL);
        onClose();

        const successMsg = existingLlmProvider
          ? "Provider updated successfully!"
          : "Provider enabled successfully!";
        toast({
          title: "Operation Successful",
          description: successMsg,
          variant: "success",
        });

        setSubmitting(false);
      }}
    >
      {({ values }) => (
        <Form>
          <TextFormField
            name="name"
            label="Display Name"
            subtext="A name which you can use to identify this provider when selecting it in the UI."
            placeholder="Display Name"
            disabled={existingLlmProvider ? true : false}
          />

          <div className="pt-2" />

          {llmProviderDescriptor.api_key_required && (
            <TextFormField
              name="api_key"
              label="API Key"
              placeholder="API Key"
              type="password"
            />
          )}

          {llmProviderDescriptor.api_base_required && (
            <TextFormField
              name="api_base"
              label="API Base"
              placeholder="API Base"
            />
          )}

          {llmProviderDescriptor.api_version_required && (
            <TextFormField
              name="api_version"
              label="API Version"
              placeholder="API Version"
            />
          )}

          {llmProviderDescriptor.custom_config_keys?.map((customConfigKey) => (
            <div key={customConfigKey.name}>
              <TextFormField
                name={`custom_config.${customConfigKey.name}`}
                label={
                  customConfigKey.is_required
                    ? customConfigKey.name
                    : `[Optional] ${customConfigKey.name}`
                }
                subtext={customConfigKey.description || undefined}
              />
            </div>
          ))}

          <div className="pt-2" />

          {llmProviderDescriptor.llm_names.length > 0 ? (
            <SelectorFormField
              name="default_model_name"
              subtext="The model to use by default for this provider unless otherwise specified."
              label="Default Model"
              options={llmProviderDescriptor.llm_names.map((name) => ({
                name,
                value: name,
              }))}
              maxHeight="max-h-56"
            />
          ) : (
            <TextFormField
              name="default_model_name"
              subtext="The model to use by default for this provider unless otherwise specified."
              label="Default Model"
              placeholder="E.g. gpt-4"
            />
          )}

          <div className="pt-2" />

          {llmProviderDescriptor.llm_names.length > 0 ? (
            <SelectorFormField
              name="fast_default_model_name"
              subtext={`The model to use for lighter flows like \`LLM Chunk Filter\` 
                for this provider. If \`Default\` is specified, will use 
                the Default Model configured above.`}
              label="[Optional] Fast Model"
              options={llmProviderDescriptor.llm_names.map((name) => ({
                name,
                value: name,
              }))}
              includeDefault
              maxHeight="max-h-56"
            />
          ) : (
            <TextFormField
              name="fast_default_model_name"
              subtext={`The model to use for lighter flows like \`LLM Chunk Filter\` 
                for this provider. If \`Default\` is specified, will use 
                the Default Model configured above.`}
              label="[Optional] Fast Model"
              placeholder="E.g. gpt-4"
            />
          )}

          <div className="pt-2" />

          <div>
            {/* NOTE: this is above the test button to make sure it's visible */}
            {testError && (
              <p className="text-error mt-2 text-sm">{testError}</p>
            )}

            <div className="flex w-full mt-4">
              <Button type="submit">
                {isTesting ? (
                  <LoadingAnimation text="Testing" />
                ) : existingLlmProvider ? (
                  "Update"
                ) : (
                  "Enable"
                )}
              </Button>
              {existingLlmProvider && (
                <Button
                  type="button"
                  className="ml-3"
                  variant="destructive"
                  onClick={async () => {
                    const response = await fetch(
                      `${LLM_PROVIDERS_ADMIN_URL}/${existingLlmProvider.id}`,
                      {
                        method: "DELETE",
                      }
                    );
                    if (!response.ok) {
                      const errorMsg = (await response.json()).detail;
                      toast({
                        title: "Failed to delete provider",
                        description: `Error details: ${errorMsg}`,
                        variant: "destructive",
                      });
                      return;
                    }

                    mutate(LLM_PROVIDERS_ADMIN_URL);
                    onClose();
                    toast({
                      title: "Provider deleted",
                      description:
                        "The provider has been successfully deleted.",
                      variant: "success",
                    });
                  }}
                >
                  <Trash size={16} /> Delete
                </Button>
              )}
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}
