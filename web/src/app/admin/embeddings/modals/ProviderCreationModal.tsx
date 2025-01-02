import React, { useRef, useState } from "react";
import { LoadingAnimation } from "@/components/Loading";
import {
  CloudEmbeddingProvider,
  EmbeddingProvider,
} from "../../../../components/embedding/interfaces";
import { EMBEDDING_PROVIDERS_ADMIN_URL } from "../../configuration/llm/constants";
import { CustomModal } from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { InputForm } from "@/components/admin/connectors/Field";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  EMBEDDING_ERROR_MESSAGES,
  GLOBAL_ERROR_MESSAGES,
} from "@/constants/toast/error";

export function ProviderCreationModal({
  selectedProvider,
  onConfirm,
  onCancel,
  existingProvider,
  isProxy,
  isAzure,
  updateCurrentModel,
  showTentativeProvider,
}: {
  updateCurrentModel: (
    newModel: string,
    provider_type: EmbeddingProvider
  ) => void;
  selectedProvider: CloudEmbeddingProvider;
  onConfirm: () => void;
  onCancel: () => void;
  existingProvider?: CloudEmbeddingProvider;
  isProxy?: boolean;
  isAzure?: boolean;
  showTentativeProvider?: boolean;
}) {
  const { toast } = useToast();
  const useFileUpload = selectedProvider.provider_type == "Google";

  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const formSchema = z.object({
    provider_type: z.string().min(1, { message: "Provider type is required" }),
    api_key:
      isProxy || isAzure
        ? z.string()
        : useFileUpload
          ? z.string()
          : z.string().min(1, { message: "API Key is required" }),
    model_name: isProxy
      ? z.string().min(1, { message: "Model name is required" })
      : z.string().nullable(),
    api_url:
      isProxy || isAzure
        ? z.string().min(1, { message: "API URL is required" })
        : z.string(),
    deployment_name: isAzure
      ? z.string().min(1, { message: "Deployment name is required" })
      : z.string(),
    api_version: isAzure
      ? z.string().min(1, { message: "API Version is required" })
      : z.string(),
    custom_config: z.array(z.tuple([z.string(), z.string()])).optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const initialValues = {
    provider_type:
      existingProvider?.provider_type || selectedProvider.provider_type,
    api_key: existingProvider?.api_key || "",
    api_url: existingProvider?.api_url || "",
    custom_config: existingProvider?.custom_config
      ? Object.entries(existingProvider.custom_config)
      : [],
    model_id: 0,
    model_name: null,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: (field: "api_key", value: any) => void
  ) => {
    const file = event.target.files?.[0];
    setFileName("");
    if (file) {
      setFileName(file.name);
      try {
        const fileContent = await file.text();
        let jsonContent;
        try {
          jsonContent = JSON.parse(fileContent);
        } catch (parseError) {
          throw new Error(
            "Failed to parse JSON file. Please ensure it's a valid JSON."
          );
        }
        setFieldValue("api_key", JSON.stringify(jsonContent));
      } catch (error) {
        setFieldValue("api_key", "");
      }
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsProcessing(true);
    try {
      const customConfig = Object.fromEntries(values.custom_config || []);

      const initialResponse = await fetch(
        "/api/admin/embedding/test-embedding",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider_type: values.provider_type.toLowerCase().split(" ")[0],
            api_key: values.api_key,
            api_url: values.api_url,
            model_name: values.model_name,
            api_version: values.api_version,
            deployment_name: values.deployment_name,
          }),
        }
      );

      if (!initialResponse.ok) {
        const errorMsg = (await initialResponse.json()).detail;
        toast({
          title: EMBEDDING_ERROR_MESSAGES.TEST_PROVIDER.title,
          description:
            EMBEDDING_ERROR_MESSAGES.TEST_PROVIDER.description(errorMsg),
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const response = await fetch(EMBEDDING_PROVIDERS_ADMIN_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          api_version: values.api_version,
          deployment_name: values.deployment_name,
          provider_type: values.provider_type.toLowerCase().split(" ")[0],
          custom_config: customConfig,
          is_default_provider: false,
          is_configured: true,
        }),
      });

      if (isAzure) {
        updateCurrentModel(values.model_name || "", EmbeddingProvider.AZURE);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Failed to update provider- check your API key"
        );
      }

      toast({
        title: EMBEDDING_ERROR_MESSAGES.UPDATE_PROVIDER.title,
        description: EMBEDDING_ERROR_MESSAGES.UPDATE_PROVIDER.description,
        variant: "success",
      });

      onConfirm();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log(error);
        toast({
          title: GLOBAL_ERROR_MESSAGES.UNEXPECTED.title,
          description: GLOBAL_ERROR_MESSAGES.UNEXPECTED.description(
            error.message
          ),
          variant: "destructive",
        });
      } else {
        console.log(error);
        toast({
          title: GLOBAL_ERROR_MESSAGES.UNKNOWN.title,
          description: GLOBAL_ERROR_MESSAGES.UNKNOWN.description,
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <CustomModal
      title={
        <div className="flex items-center gap-4">
          {selectedProvider.icon({ size: 24 })} Configure{" "}
          {selectedProvider.provider_type}
        </div>
      }
      onClose={onCancel}
      trigger={null}
      open={showTentativeProvider}
    >
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p className="mb-2">
              You are setting the credentials for this provider. To access this
              information, follow the instructions{" "}
              <a
                className="cursor-pointer underline"
                target="_blank"
                href={selectedProvider.docsLink}
              >
                here
              </a>{" "}
              and gather your{" "}
              <a
                className="cursor-pointer underline"
                target="_blank"
                href={selectedProvider.apiLink}
              >
                {isProxy || isAzure ? "API URL" : "API KEY"}
              </a>
            </p>

            <div className="flex w-full flex-col gap-y-6">
              {(isProxy || isAzure) && (
                <InputForm
                  formControl={form.control}
                  name="api_url"
                  label="API URL"
                  placeholder="API URL"
                />
              )}
              {isProxy && (
                <InputForm
                  formControl={form.control}
                  name="model_name"
                  label={`Model Name ${isProxy ? "(for testing)" : ""}`}
                  placeholder="Model Name"
                />
              )}

              {isAzure && (
                <InputForm
                  formControl={form.control}
                  name="deployment_name"
                  label="Deployment Name"
                  placeholder="Deployment Name"
                />
              )}

              {isAzure && (
                <InputForm
                  formControl={form.control}
                  name="api_version"
                  label="API Version"
                  placeholder="API Version"
                />
              )}

              {useFileUpload ? (
                <>
                  <Label>Upload JSON File</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={(e) => handleFileUpload(e, form.setValue)}
                    className="text-lg w-full p-1"
                  />
                  {fileName && <p>Uploaded file: {fileName}</p>}
                </>
              ) : (
                <InputForm
                  formControl={form.control}
                  name="api_key"
                  label={`API Key ${isProxy ? "(for non-local deployments)" : ""}`}
                  placeholder="API Key"
                  type="password"
                />
              )}

              <a
                href={selectedProvider.apiLink}
                target="_blank"
                className="underline cursor-pointer w-fit"
              >
                Learn more here
              </a>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {isProcessing ? (
                <LoadingAnimation />
              ) : existingProvider ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </CustomModal>
  );
}
