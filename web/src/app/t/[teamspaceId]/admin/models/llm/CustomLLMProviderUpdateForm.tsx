import { LoadingAnimation } from "@/components/Loading";
import { Text } from "@tremor/react";
import {
  ArrayHelpers,
  ErrorMessage,
  Field,
  FieldArray,
  FieldProps,
  Form,
  Formik,
} from "formik";
import { LLM_PROVIDERS_ADMIN_URL } from "./constants";
import {
  SubLabel,
  TextArrayField,
  TextFormField,
} from "@/components/admin/connectors/Field";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { FullLLMProvider } from "./interfaces";
import { PopupSpec } from "@/components/admin/connectors/Popup";
import * as Yup from "yup";
import isEqual from "lodash/isEqual";
import { Button } from "@/components/ui/button";
import { Plus, Trash, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomTooltip } from "@/components/CustomTooltip";

function customConfigProcessing(customConfigsList: [string, string][]) {
  const customConfig: { [key: string]: string } = {};
  customConfigsList.forEach(([key, value]) => {
    customConfig[key] = value;
  });
  return customConfig;
}

export function CustomLLMProviderUpdateForm({
  onClose,
  existingLlmProvider,
  shouldMarkAsDefault,
}: {
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
    provider: existingLlmProvider?.provider ?? "",
    api_key: existingLlmProvider?.api_key ?? "",
    api_base: existingLlmProvider?.api_base ?? "",
    api_version: existingLlmProvider?.api_version ?? "",
    default_model_name: existingLlmProvider?.default_model_name ?? null,
    fast_default_model_name:
      existingLlmProvider?.fast_default_model_name ?? null,
    model_names: existingLlmProvider?.model_names ?? [],
    custom_config_list: existingLlmProvider?.custom_config
      ? Object.entries(existingLlmProvider.custom_config)
      : [],
  };

  // Setup validation schema if required
  const validationSchema = Yup.object({
    name: Yup.string().required("Display Name is required"),
    provider: Yup.string().required("Provider Name is required"),
    api_key: Yup.string(),
    api_base: Yup.string(),
    api_version: Yup.string(),
    model_names: Yup.array(Yup.string().required("Model name is required")),
    default_model_name: Yup.string().required("Model name is required"),
    fast_default_model_name: Yup.string().nullable(),
    custom_config_list: Yup.array(),
  });

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setSubmitting(true);

        if (values.model_names.length === 0) {
          const fullErrorMsg = "At least one model name is required";
          toast({
            title: "Model Name Required",
            description: fullErrorMsg,
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }

        // test the configuration
        if (!isEqual(values, initialValues)) {
          setIsTesting(true);

          const response = await fetch("/api/admin/llm/test", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              custom_config: customConfigProcessing(values.custom_config_list),
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
            ...values,
            custom_config: customConfigProcessing(values.custom_config_list),
          }),
        });

        if (!response.ok) {
          const errorMsg = (await response.json()).detail;
          const fullErrorMsg = existingLlmProvider
            ? `Error updating provider: ${errorMsg}`
            : `Error enabling provider: ${errorMsg}`;

          toast({
            title: "Operation Failed",
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
          />

          <div className="pt-2" />

          <TextFormField
            name="provider"
            label="Provider Name"
            subtext={
              <>
                Should be one of the providers listed at{" "}
                <a
                  target="_blank"
                  href="https://docs.litellm.ai/docs/providers"
                  className="text-link"
                >
                  https://docs.litellm.ai/docs/providers
                </a>
                .
              </>
            }
            placeholder="Name of the custom provider"
          />

          <div className="pt-2" />

          <SubLabel>
            Fill in the following as is needed. Refer to the LiteLLM
            documentation for the model provider name specified above in order
            to determine which fields are required.
          </SubLabel>

          <TextFormField
            name="api_key"
            label="[Optional] API Key"
            placeholder="API Key"
            type="password"
          />

          <div className="pt-2" />

          <TextFormField
            name="api_base"
            label="[Optional] API Base"
            placeholder="API Base"
          />

          <div className="pt-2" />

          <TextFormField
            name="api_version"
            label="[Optional] API Version"
            placeholder="API Version"
          />

          <div className="pt-2" />

          <Label className="pb-1">[Optional] Custom Configs</Label>
          <SubLabel>
            <>
              <div>
                Additional configurations needed by the model provider. Are
                passed to litellm via environment variables.
              </div>

              <div className="pt-2">
                For example, when configuring the Cloudflare provider, you would
                need to set `CLOUDFLARE_ACCOUNT_ID` as the key and your
                Cloudflare account ID as the value.
              </div>
            </>
          </SubLabel>

          <FieldArray
            name="custom_config_list"
            render={(arrayHelpers: ArrayHelpers<any[]>) => (
              <div>
                {values.custom_config_list.map((_, index) => {
                  return (
                    <div key={index} className={index === 0 ? "mt-2" : "mt-6"}>
                      <div className="flex">
                        <div className="w-full mr-6 border border-border p-3 rounded">
                          <div className="space-y-2">
                            <Label>Key</Label>
                            <Field name={`custom_config_list[${index}][0]`}>
                              {({ field }: FieldProps) => (
                                <Input
                                  {...field}
                                  id={`custom_config_list[${index}][0]`}
                                  name={`custom_config_list[${index}][0]`}
                                  autoComplete="off"
                                />
                              )}
                            </Field>

                            <ErrorMessage
                              name={`custom_config_list[${index}][0]`}
                              component="div"
                              className="text-error text-sm mt-1"
                            />
                          </div>

                          <div className="mt-3 space-y-2">
                            <Label>Value</Label>
                            <Field name={`custom_config_list[${index}][1]`}>
                              {({ field }: FieldProps) => (
                                <Input
                                  {...field}
                                  id={`custom_config_list[${index}][1]`}
                                  name={`custom_config_list[${index}][1]`}
                                  autoComplete="off"
                                />
                              )}
                            </Field>
                            <ErrorMessage
                              name={`custom_config_list[${index}][1]`}
                              component="div"
                              className="text-error text-sm mt-1"
                            />
                          </div>
                        </div>
                        <CustomTooltip
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="my-auto"
                            >
                              <X
                                size={16}
                                onClick={() => arrayHelpers.remove(index)}
                              />
                            </Button>
                          }
                          asChild
                        >
                          Remove
                        </CustomTooltip>
                      </div>
                    </div>
                  );
                })}

                <Button
                  onClick={() => {
                    arrayHelpers.push(["", ""]);
                  }}
                  className="mb-4"
                  type="button"
                >
                  <Plus size={16} /> Add New
                </Button>
              </div>
            )}
          />

          <div className="pt-2" />

          <TextArrayField
            name="model_names"
            label="Model Names"
            values={values}
            subtext={`List the individual models that you want to make 
            available as a part of this provider. At least one must be specified. 
            As an example, for OpenAI one model might be "gpt-4".`}
          />

          <div className="pt-2" />

          <TextFormField
            name="default_model_name"
            subtext={`
              The model to use by default for this provider unless 
              otherwise specified. Must be one of the models listed 
              above.`}
            label="Default Model"
            placeholder="E.g. gpt-4"
          />

          <div className="pt-2" />

          <TextFormField
            name="fast_default_model_name"
            subtext={`The model to use for lighter flows like \`LLM Chunk Filter\` 
                for this provider. If not set, will use 
                the Default Model configured above.`}
            label="[Optional] Fast Model"
            placeholder="E.g. gpt-4"
          />

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
                  variant="destructive"
                  className="ml-3"
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
