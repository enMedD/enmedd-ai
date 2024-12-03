import { CloudEmbeddingModel, EmbeddingProvider } from "./interfaces";
import { Dispatch, SetStateAction } from "react";
import { Button, Text } from "@tremor/react";
import { EmbeddingDetails } from "@/app/admin/embeddings/EmbeddingModelSelectionForm";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "../ui/checkbox";

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

        <FormField
          control={form.control}
          name="model_name"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel htmlFor="model_name">Model Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 'all-MiniLM-L6-v2'" {...field} />
              </FormControl>
              <FormDescription>
                The name of the $
                {embeddingType === EmbeddingProvider.AZURE
                  ? "Azure"
                  : "LiteLLM"}{" "}
                model
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model_dim"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel htmlFor="model_dim">Model Dimension</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g. '1536'"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(Number(e.target.value) || "")}
                />
              </FormControl>
              <FormDescription>
                The dimension of the model&apos;s embeddings
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="normalize"
          render={({ field }) => (
            <FormItem className="flex gap-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked)}
                />
              </FormControl>
              <FormLabel className="!mt-0 !mb-3 !space-y-1.5">
                <span>Normalize</span>
                <p className="text-sm text-muted-foreground font-normal">
                  Whether to normalize the embeddings
                </p>
              </FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="query_prefix"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel htmlFor="query_prefix">
                [Optional] Query Prefix
              </FormLabel>
              <FormControl>
                <Input placeholder="E.g. 'query: '" {...field} />
              </FormControl>
              <FormDescription>Prefix for query embeddings</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="passage_prefix"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel htmlFor="passage_prefix">
                [Optional] Passage Prefix
              </FormLabel>
              <FormControl>
                <Input placeholder="E.g. 'passage: '" {...field} />
              </FormControl>
              <FormDescription>Prefix for passage embeddings</FormDescription>
              <FormMessage />
            </FormItem>
          )}
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
