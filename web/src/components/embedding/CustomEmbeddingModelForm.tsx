import { CloudEmbeddingModel, EmbeddingProvider } from "./interfaces";
import { Dispatch, SetStateAction } from "react";
import { Button, Text } from "@tremor/react";
import { EmbeddingDetails } from "@/app/admin/embeddings/EmbeddingModelSelectionForm";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { CheckboxForm, InputForm } from "../admin/connectors/Field";

const formSchema = z.object({
  model_name: z.string().min(1, "Model name is required"),
  model_dim: z.number().min(1, "Model dimension is required"),
  normalize: z.boolean(),
  query_prefix: z.string().optional(),
  passage_prefix: z.string().optional(),
  provider_type: z.string().min(1, "Provider type is required"),
  api_key: z.string().optional(),
  enabled: z.boolean(),
  api_url: z
    .string()
    .url("Must be a valid URL")
    .min(1, "API base URL is required"),
  description: z.string().optional(),
  index_name: z.string().nullable(),
  pricePerMillion: z.number().optional(),
  mtebScore: z.number().optional(),
  maxContext: z.number().optional(),
  max_tokens: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CustomEmbeddingModelForm({
  setShowTentativeModel,
  currentValues,
  provider,
  embeddingType,
}: {
  setShowTentativeModel: Dispatch<SetStateAction<CloudEmbeddingModel | null>>;
  currentValues: CloudEmbeddingModel | null;
  provider: EmbeddingDetails;
  embeddingType: EmbeddingProvider;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model_name: "",
      model_dim: 768,
      normalize: false,
      query_prefix: "",
      passage_prefix: "",
      provider_type: embeddingType,
      api_key: "",
      enabled: true,
      api_url: provider.api_url,
      description: "",
      index_name: "",
      pricePerMillion: 0,
      mtebScore: 0,
      maxContext: 4096,
      max_tokens: 1024,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setShowTentativeModel(values as CloudEmbeddingModel);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Text className="text-xl text-text-900 font-bold mb-4">
          Specify details for your{" "}
          {embeddingType === EmbeddingProvider.AZURE ? "Azure" : "LiteLLM"}{" "}
          Provider&apos;s model
        </Text>

        <InputForm
          formControl={form.control}
          name="model_name"
          label="Model Name"
          placeholder="e.g. 'all-MiniLM-L6-v2'"
          description={
            <>
              The name of the{" "}
              {embeddingType === EmbeddingProvider.AZURE ? "Azure" : "LiteLLM"}{" "}
              model
            </>
          }
          isDescriptionBelow
        />

        <InputForm
          formControl={form.control}
          name="model_dim"
          type="number"
          label="Model Dimension"
          placeholder="e.g. '1536'"
          description="The dimension of the model's embeddings"
          isDescriptionBelow
        />

        <CheckboxForm
          formControl={form.control}
          name="normalize"
          label="Normalize"
          description="Whether to normalize the embeddings"
        />

        <InputForm
          formControl={form.control}
          name="query_prefix"
          label="[Optional] Query Prefix"
          placeholder="E.g. 'query: '"
          description="Prefix for query embeddings"
          isDescriptionBelow
        />

        <InputForm
          formControl={form.control}
          name="passage_prefix"
          label="[Optional] Passage Prefix"
          placeholder="E.g. 'passage: '"
          description="Prefix for passage embeddings"
          isDescriptionBelow
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-64 mx-auto"
        >
          Configure{" "}
          {embeddingType === EmbeddingProvider.AZURE ? "Azure" : "LiteLLM"}{" "}
          Model
        </Button>
      </form>
    </Form>
  );
}
