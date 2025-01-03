import { LoadingAnimation } from "@/components/Loading";
import { Text } from "@tremor/react";
import { AdvancedOptionsToggle } from "@/components/AdvancedOptionsToggle";
import {
  ArrayHelpers,
  ErrorMessage,
  Field,
  FieldArray,
  Form,
  Formik,
} from "formik";
import { FiPlus, FiTrash, FiX } from "react-icons/fi";
import { LLM_PROVIDERS_ADMIN_URL } from "./constants";
import {
  Label,
  SubLabel,
  TextArrayField,
  TextFormField,
} from "@/components/admin/connectors/Field";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { FullLLMProvider } from "./interfaces";
import * as Yup from "yup";
import isEqual from "lodash/isEqual";
import { IsPublicGroupSelector } from "@/components/IsPublicGroupSelector";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/Divider";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label as ShadcnLabel } from "@/components/ui/label";
import { CustomTooltip } from "@/components/CustomTooltip";
import { LLM_ERROR_MESSAGES } from "@/constants/toast/error";
import { LLM_SUCCESS_MESSAGES } from "@/constants/toast/success";

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
  hideSuccess,
}: {
  onClose: () => void;
  existingLlmProvider?: FullLLMProvider;
  shouldMarkAsDefault?: boolean;
  hideSuccess?: boolean;
}) {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();

  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState<string>("");

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

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
    is_public: existingLlmProvider?.is_public ?? true,
    groups: existingLlmProvider?.groups ?? [],
    deployment_name: existingLlmProvider?.deployment_name ?? null,
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
    // EE Only
    is_public: Yup.boolean().required(),
    groups: Yup.array().of(Yup.number()),
    deployment_name: Yup.string().nullable(),
  });

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setSubmitting(true);

        if (values.model_names.length === 0) {
          toast({
            title: LLM_ERROR_MESSAGES.REQUIRED_MODEL_NAME.title,
            description: LLM_ERROR_MESSAGES.REQUIRED_MODEL_NAME.description,
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
          toast({
            title: LLM_ERROR_MESSAGES.UPDATE_LLM.title(existingLlmProvider),
            description: LLM_ERROR_MESSAGES.UPDATE_LLM.description(
              existingLlmProvider,
              errorMsg
            ),
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
            toast({
              title: LLM_ERROR_MESSAGES.PROVIDER.title,
              description: LLM_ERROR_MESSAGES.PROVIDER.description(errorMsg),
              variant: "destructive",
            });
            return;
          }
        }

        mutate(LLM_PROVIDERS_ADMIN_URL);
        onClose();

        if (!hideSuccess) {
          toast({
            title:
              LLM_SUCCESS_MESSAGES.UPDATE_PROVIDER.title(existingLlmProvider),
            description:
              LLM_SUCCESS_MESSAGES.UPDATE_PROVIDER.description(
                existingLlmProvider
              ),
            variant: "success",
          });
        }

        setSubmitting(false);
      }}
    >
      {(formikProps) => {
        return (
          <Form className="gap-y-6">
            <TextFormField
              name="name"
              label="Display Name"
              subtext="A name which you can use to identify this provider when selecting it in the UI."
              placeholder="Display Name"
              disabled={existingLlmProvider ? true : false}
            />

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
                    rel="noreferrer"
                  >
                    https://docs.litellm.ai/docs/providers
                  </a>
                  .
                </>
              }
              placeholder="Name of the custom provider"
            />

            <Divider />

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
              optional
            />

            {existingLlmProvider?.deployment_name && (
              <TextFormField
                name="deployment_name"
                label="[Optional] Deployment Name"
                placeholder="Deployment Name"
                optional
              />
            )}

            <TextFormField
              name="api_base"
              label="[Optional] API Base"
              placeholder="API Base"
              optional
            />

            <TextFormField
              name="api_version"
              label="[Optional] API Version"
              placeholder="API Version"
              optional
            />

            <Label className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5">
              [Optional] Custom Configs
            </Label>
            <SubLabel>
              <>
                <div>
                  Additional configurations needed by the model provider. Are
                  passed to litellm via environment variables.
                </div>

                <div className="mt-2">
                  For example, when configuring the Cloudflare provider, you
                  would need to set `CLOUDFLARE_ACCOUNT_ID` as the key and your
                  Cloudflare account ID as the value.
                </div>
              </>
            </SubLabel>

            <FieldArray
              name="custom_config_list"
              render={(arrayHelpers: ArrayHelpers<any[]>) => (
                <div>
                  {formikProps.values.custom_config_list.map((_, index) => {
                    return (
                      <div
                        key={index}
                        className={index === 0 ? "mt-2" : "mt-6"}
                      >
                        <div className="flex">
                          <Card className="mr-4 w-full">
                            <CardContent>
                              <div className="grid gap-1.5">
                                <ShadcnLabel className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  Key
                                </ShadcnLabel>
                                <Input
                                  name={`custom_config_list[${index}][0]`}
                                  autoComplete="off"
                                />
                                <ErrorMessage
                                  name={`custom_config_list[${index}][0]`}
                                  component="div"
                                  className="text-error text-sm mt-1"
                                />
                              </div>

                              <div className="mt-3 grid gap-1.5">
                                <ShadcnLabel className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  Value
                                </ShadcnLabel>
                                <Input
                                  name={`custom_config_list[${index}][1]`}
                                  autoComplete="off"
                                />
                                <ErrorMessage
                                  name={`custom_config_list[${index}][1]`}
                                  component="div"
                                  className="text-error text-sm mt-1"
                                />
                              </div>
                            </CardContent>
                          </Card>
                          <div className="my-auto">
                            <CustomTooltip
                              asChild
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => arrayHelpers.remove(index)}
                                >
                                  <FiX />
                                </Button>
                              }
                            >
                              Remove
                            </CustomTooltip>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    onClick={() => {
                      arrayHelpers.push(["", ""]);
                    }}
                  >
                    <FiPlus /> Add New
                  </Button>
                </div>
              )}
            />

            <Divider />

            {!existingLlmProvider?.deployment_name && (
              <TextArrayField
                name="model_names"
                label="Model Names"
                values={formikProps.values}
                subtext={
                  <>
                    List the individual models that you want to make available
                    as a part of this provider. At least one must be specified.
                    For the best experience your [Provider Name]/[Model Name]
                    should match one of the pairs listed{" "}
                    <a
                      target="_blank"
                      href="https://models.zlitellm.ai/"
                      className="text-link"
                      rel="noreferrer"
                    >
                      here
                    </a>
                    .
                  </>
                }
              />
            )}

            <Divider />

            <TextFormField
              name="default_model_name"
              subtext={`
              The model to use by default for this provider unless
              otherwise specified. Must be one of the models listed
              above.`}
              label="Default Model"
              placeholder="E.g. gpt-4"
            />

            {!existingLlmProvider?.deployment_name && (
              <TextFormField
                name="fast_default_model_name"
                subtext={`The model to use for lighter flows like \`LLM Chunk Filter\`
                for this provider. If not set, will use
                the Default Model configured above.`}
                label="[Optional] Fast Model"
                placeholder="E.g. gpt-4"
                optional
              />
            )}

            <Divider />

            <AdvancedOptionsToggle
              showAdvancedOptions={showAdvancedOptions}
              setShowAdvancedOptions={setShowAdvancedOptions}
            />

            {showAdvancedOptions && (
              <IsPublicGroupSelector
                formikProps={formikProps}
                objectName="LLM Provider"
                publicToWhom="all users"
                enforceGroupSelection={true}
              />
            )}

            <div>
              {/* NOTE: this is above the test button to make sure it's visible */}
              {testError && (
                <Text className="text-error mt-2">{testError}</Text>
              )}

              <div className="flex w-full mt-4 justify-end gap-2">
                {existingLlmProvider && (
                  <Button
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
                        alert(`Failed to delete provider: ${errorMsg}`);
                        return;
                      }

                      mutate(LLM_PROVIDERS_ADMIN_URL);
                      onClose();
                    }}
                    type="button"
                  >
                    <FiTrash /> Delete
                  </Button>
                )}
                <Button type="submit">
                  {isTesting ? (
                    <LoadingAnimation text="Testing" />
                  ) : existingLlmProvider ? (
                    "Update"
                  ) : (
                    "Enable"
                  )}
                </Button>
              </div>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
