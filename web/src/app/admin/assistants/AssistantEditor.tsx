"use client";

import { generateRandomIconShape, createSVG } from "@/lib/assistantIconUtils";
import { CCPairBasicInfo, DocumentSet, User } from "@/lib/types";
import { Divider } from "@tremor/react";
import {
  CheckboxForm,
  DatePicker,
  InputForm,
  Label,
} from "@/components/admin/connectors/Field";
import { getDisplayNameForModel } from "@/lib/hooks";
import { DocumentSetSelectable } from "@/components/documentSet/DocumentSetSelectable";
import { Option } from "@/components/Dropdown";
import { addAssistantToList } from "@/lib/assistants/updateAssistantPreferences";
import { checkLLMSupportsImageOutput, destructureValue } from "@/lib/llm/utils";
import { ToolSnapshot } from "@/lib/tools/interfaces";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiInfo, FiX } from "react-icons/fi";
import CollapsibleSection from "./CollapsibleSection";
import { SuccessfulAssistantUpdateRedirectType } from "./enums";
import { Assistant } from "./interfaces";
import {
  buildFinalPrompt,
  createAssistant,
  providersContainImageGeneratingSupport,
  updateAssistant,
} from "./lib";
import { Popover } from "@/components/popover/Popover";
import {
  CameraIcon,
  NewChatIcon,
  SwapIcon,
  TrashIcon,
} from "@/components/icons/icons";
import { AdvancedOptionsToggle } from "@/components/AdvancedOptionsToggle";
import { buildImgUrl } from "@/app/chat/files/images/utils";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Card, CardContent } from "@/components/ui/card";
import { z } from "zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { FullLLMProvider } from "../configuration/llm/interfaces";
import { IsPublicGroupSelector2 } from "@/components/IsPublicGroupSelector";
import { LlmList } from "@/components/llm/LLMList";
import { useAssistants } from "@/context/AssistantsContext";
import { ASSISTANT_ERROR_MESSAGES } from "@/constants/toast/error";
import { ASSISTANT_SUCCESS_MESSAGES } from "@/constants/toast/success";

const formSchema = z.object({
  name: z.string().min(1, "Must provide a name for the Assistant"),
  description: z
    .string()
    .min(1, "Must provide a description for the Assistant"),
  system_prompt: z.string().default(""),
  task_prompt: z.string().default(""),
  is_public: z.boolean().refine((val) => val !== undefined, {
    message: "Must be a boolean value",
  }),
  document_set_ids: z.array(z.number()).default([]),
  num_chunks: z.number().nullable().default(10),
  include_citations: z.boolean().refine((val) => val !== undefined, {
    message: "Must be a boolean value",
  }),
  llm_relevance_filter: z.boolean().refine((val) => val !== undefined, {
    message: "Must be a boolean value",
  }),
  llm_model_version_override: z.string().nullable(),
  llm_model_provider_override: z.string().nullable(),
  starter_messages: z.array(
    z.object({
      name: z.string().min(1, { message: "Name is required" }),
      description: z.string().nullable(),
      message: z.string().min(1, { message: "Message is required" }),
    })
  ),
  search_start_date: z
    .date()
    .nullable()
    .transform((val) => (val instanceof Date ? val : null)),
  icon_color: z.string().nullable(),
  icon_shape: z.number().nullable(),
  uploaded_image: z.instanceof(File).nullable().default(null),
  enabled_tools_map: z.record(z.boolean()),
  // EE Only
  groups: z.array(z.number()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

function findSearchTool(tools: ToolSnapshot[]) {
  return tools.find((tool) => tool.in_code_tool_id === "SearchTool");
}

function findImageGenerationTool(tools: ToolSnapshot[]) {
  return tools.find((tool) => tool.in_code_tool_id === "ImageGenerationTool");
}

function findInternetSearchTool(tools: ToolSnapshot[]) {
  return tools.find((tool) => tool.in_code_tool_id === "InternetSearchTool");
}

function SubLabel({ children }: { children: string | JSX.Element }) {
  return <span className="mb-2 text-sm text-subtle">{children}</span>;
}

export function AssistantEditor({
  existingAssistant,
  ccPairs,
  documentSets,
  user,
  defaultPublic,
  redirectType,
  llmProviders,
  tools,
  shouldAddAssistantToUserPreferences,
  admin,
  teamspaceId,
}: {
  existingAssistant?: Assistant | null;
  ccPairs: CCPairBasicInfo[];
  documentSets: DocumentSet[];
  user: User | null;
  defaultPublic: boolean;
  redirectType: SuccessfulAssistantUpdateRedirectType;
  llmProviders: FullLLMProvider[];
  tools: ToolSnapshot[];
  shouldAddAssistantToUserPreferences?: boolean;
  admin?: boolean;
  teamspaceId?: string | string[];
}) {
  const { refreshAssistants } = useAssistants();
  const router = useRouter();
  const { toast } = useToast();

  const colorOptions = [
    "#FF6FBF",
    "#6FB1FF",
    "#B76FFF",
    "#FFB56F",
    "#6FFF8D",
    "#FF6F6F",
    "#6FFFFF",
  ];

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [loading, setLoading] = useState(false);

  // state to persist across formik reformatting
  const [defautIconColor, _setDeafultIconColor] = useState(
    colorOptions[Math.floor(Math.random() * colorOptions.length)]
  );

  const [defaultIconShape, setDefaultIconShape] = useState<any>(null);

  useEffect(() => {
    if (defaultIconShape === null) {
      setDefaultIconShape(generateRandomIconShape().encodedGrid);
    }
  }, []);

  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);

  const [finalPrompt, setFinalPrompt] = useState<string | null>("");
  const [finalPromptError, setFinalPromptError] = useState<string>("");
  const [removeAssistantImage, setRemoveAssistantImage] = useState(false);

  const triggerFinalPromptUpdate = async (
    systemPrompt: string,
    taskPrompt: string,
    retrievalDisabled: boolean
  ) => {
    const response = await buildFinalPrompt(
      systemPrompt,
      taskPrompt,
      retrievalDisabled
    );
    if (response.ok) {
      setFinalPrompt((await response.json()).final_prompt_template);
    }
  };

  const isUpdate =
    existingAssistant !== undefined && existingAssistant !== null;
  const existingPrompt = existingAssistant?.prompts[0] ?? null;

  useEffect(() => {
    if (isUpdate && existingPrompt) {
      triggerFinalPromptUpdate(
        existingPrompt.system_prompt,
        existingPrompt.task_prompt,
        existingAssistant.num_chunks === 0
      );
    }
  }, []);

  const defaultProvider = llmProviders.find(
    (llmProvider) => llmProvider.is_default_provider
  );
  const defaultProviderName = defaultProvider?.provider;
  const defaultModelName = defaultProvider?.default_model_name;
  const providerDisplayNameToProviderName = new Map<string, string>();
  llmProviders.forEach((llmProvider) => {
    providerDisplayNameToProviderName.set(
      llmProvider.name,
      llmProvider.provider
    );
  });

  const modelOptionsByProvider = new Map<string, Option<string>[]>();
  llmProviders.forEach((llmProvider) => {
    const providerOptions = llmProvider.model_names.map((modelName) => {
      return {
        name: getDisplayNameForModel(modelName),
        value: modelName,
      };
    });
    modelOptionsByProvider.set(llmProvider.name, providerOptions);
  });

  const providerSupportingImageGenerationExists =
    providersContainImageGeneratingSupport(llmProviders);

  const assistantCurrentToolIds =
    existingAssistant?.tools.map((tool) => tool.id) || [];
  const searchTool = findSearchTool(tools);
  const imageGenerationTool = providerSupportingImageGenerationExists
    ? findImageGenerationTool(tools)
    : undefined;
  const internetSearchTool = findInternetSearchTool(tools);

  const customTools = tools.filter(
    (tool) =>
      tool.in_code_tool_id !== searchTool?.in_code_tool_id &&
      tool.in_code_tool_id !== imageGenerationTool?.in_code_tool_id &&
      tool.in_code_tool_id !== internetSearchTool?.in_code_tool_id
  );

  const availableTools = [
    ...customTools,
    ...(searchTool ? [searchTool] : []),
    ...(imageGenerationTool ? [imageGenerationTool] : []),
    ...(internetSearchTool ? [internetSearchTool] : []),
  ];
  const enabledToolsMap: { [key: number]: boolean } = {};
  availableTools.forEach((tool) => {
    enabledToolsMap[tool.id] = assistantCurrentToolIds.includes(tool.id);
  });

  const cachedFormData = JSON.parse(
    localStorage.getItem("assistantFormData") || "{}"
  );

  const initialValues = {
    name: existingAssistant?.name ?? cachedFormData.name ?? "",
    description:
      existingAssistant?.description ?? cachedFormData.description ?? "",
    system_prompt:
      existingPrompt?.system_prompt ?? cachedFormData.system_prompt ?? "",
    task_prompt:
      existingPrompt?.task_prompt ?? cachedFormData.task_prompt ?? "",
    is_public:
      existingAssistant?.is_public ?? cachedFormData.is_public ?? defaultPublic,
    document_set_ids:
      existingAssistant?.document_sets?.map((documentSet) => documentSet.id) ??
      cachedFormData.document_set_ids ??
      [],
    num_chunks:
      existingAssistant?.num_chunks ?? cachedFormData.num_chunks ?? 10,
    search_start_date: existingAssistant?.search_start_date
      ? new Date(existingAssistant.search_start_date)
      : cachedFormData.search_start_date
        ? new Date(cachedFormData.search_start_date)
        : null,
    include_citations:
      existingAssistant?.prompts[0]?.include_citations ??
      cachedFormData.include_citations ??
      true,
    llm_relevance_filter:
      existingAssistant?.llm_relevance_filter ??
      cachedFormData.llm_relevance_filter ??
      false,
    llm_model_provider_override:
      existingAssistant?.llm_model_provider_override ??
      cachedFormData.llm_model_provider_override ??
      null,
    llm_model_version_override:
      existingAssistant?.llm_model_version_override ??
      cachedFormData.llm_model_version_override ??
      null,
    starter_messages:
      existingAssistant?.starter_messages?.map((starterMessage) => ({
        name: starterMessage.name ?? "",
        description: starterMessage.description ?? "",
        message: starterMessage.message ?? "",
      })) ??
      cachedFormData.starter_messages ??
      [],
    enabled_tools_map:
      enabledToolsMap ?? cachedFormData.enabled_tools_map ?? {},
    icon_color:
      existingAssistant?.icon_color ??
      cachedFormData.icon_color ??
      defautIconColor,
    icon_shape:
      existingAssistant?.icon_shape ??
      cachedFormData.icon_shape ??
      defaultIconShape,
    uploaded_image: null,
    groups:
      existingAssistant?.groups?.map((group) => group) ??
      cachedFormData.groups ??
      [],
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  const [isRequestSuccessful, setIsRequestSuccessful] = useState(false);

  async function checkAssistantNameExists(name: string) {
    const response = await fetch(`/api/assistant`);
    const data = await response.json();

    const assistantNameExists = data.some(
      (assistant: Assistant) => assistant.name === name
    );

    return assistantNameExists;
  }

  const onSubmit = async (values: FormValues) => {
    if (finalPromptError) {
      toast({
        title: ASSISTANT_ERROR_MESSAGES.SUBMISSION_BLOCKED.title,
        description: ASSISTANT_ERROR_MESSAGES.SUBMISSION_BLOCKED.description,
        variant: "destructive",
      });
      return;
    }

    if (
      values.llm_model_provider_override &&
      !values.llm_model_version_override
    ) {
      toast({
        title: ASSISTANT_ERROR_MESSAGES.MODEL_SELECTION_REQUIRED.title,
        description:
          ASSISTANT_ERROR_MESSAGES.MODEL_SELECTION_REQUIRED.description,
        variant: "destructive",
      });
      return;
    }

    if (!isUpdate) {
      const assistantNameExists = await checkAssistantNameExists(values.name);
      if (assistantNameExists) {
        toast({
          title: ASSISTANT_ERROR_MESSAGES.ASSISTANT_NAME_TAKEN.title,
          description:
            ASSISTANT_ERROR_MESSAGES.ASSISTANT_NAME_TAKEN.description(
              values.name
            ),
          variant: "destructive",
        });
        return;
      }
    }
    setLoading(true);
    let enabledTools = Object.keys(values.enabled_tools_map)
      .map((toolId) => Number(toolId))
      .filter((toolId) => values.enabled_tools_map[toolId]);
    const searchToolEnabled = searchTool
      ? enabledTools.includes(searchTool.id)
      : false;
    const imageGenerationToolEnabled = imageGenerationTool
      ? enabledTools.includes(imageGenerationTool.id)
      : false;

    if (imageGenerationToolEnabled) {
      if (
        !checkLLMSupportsImageOutput(
          providerDisplayNameToProviderName.get(
            values.llm_model_provider_override || ""
          ) ||
            defaultProviderName ||
            "",
          values.llm_model_version_override || defaultModelName || ""
        )
      ) {
        enabledTools = enabledTools.filter(
          (toolId) => toolId !== imageGenerationTool!.id
        );
      }
    }

    // if disable_retrieval is set, set num_chunks to 0
    // to tell the backend to not fetch any documents
    const numChunks = searchToolEnabled ? values.num_chunks || 10 : 0;

    // don't set teamspace if marked as public
    const isPublic = teamspaceId ? false : values.is_public;
    const groups = teamspaceId
      ? [Number(teamspaceId)]
      : isPublic
        ? []
        : values.groups;

    let promptResponse;
    let assistantResponse;
    if (isUpdate) {
      [promptResponse, assistantResponse] = await updateAssistant({
        id: existingAssistant.id,
        existingPromptId: existingPrompt?.id,
        ...values,
        is_public: isPublic,
        search_start_date: values.search_start_date
          ? new Date(values.search_start_date)
          : null,
        num_chunks: numChunks,
        // users:
        //   user && !checkUserIsNoAuthUser(user.id) ? [user.id] : undefined,
        users: undefined,
        groups,
        tool_ids: enabledTools,
        remove_image: removeAssistantImage,
      });

      if (assistantResponse?.ok) {
        toast({
          title: ASSISTANT_SUCCESS_MESSAGES.ASSISTANT_UPDATED.title,
          description: ASSISTANT_SUCCESS_MESSAGES.ASSISTANT_UPDATED.description(
            values.name
          ),
          variant: "success",
        });
      }
    } else {
      [promptResponse, assistantResponse] = await createAssistant({
        ...values,
        is_public: isPublic,
        is_default_assistant: admin!,
        num_chunks: numChunks,
        search_start_date: values.search_start_date
          ? new Date(values.search_start_date)
          : null,
        // users:
        //   user && !checkUserIsNoAuthUser(user.id) ? [user.id] : undefined,
        users: undefined,
        groups,
        tool_ids: enabledTools,
        icon_shape: cachedFormData.icon_shape ?? defaultIconShape,
      });
    }

    let error = null;
    if (!promptResponse.ok) {
      error = await promptResponse.text();
    }
    if (!assistantResponse) {
      error = "Failed to create Assistant - no response received";
    } else if (!assistantResponse.ok) {
      error = await assistantResponse.text();
    }

    if (error || !assistantResponse) {
      toast({
        title: ASSISTANT_ERROR_MESSAGES.ASSISTANT_CREATION_FAILED.title,
        description:
          ASSISTANT_ERROR_MESSAGES.ASSISTANT_CREATION_FAILED.description(error),
        variant: "destructive",
      });
    } else {
      const assistant = await assistantResponse.json();
      const assistantId = assistant.id;
      console.log(shouldAddAssistantToUserPreferences);
      if (
        shouldAddAssistantToUserPreferences &&
        user?.preferences?.chosen_assistants
      ) {
        const success = await addAssistantToList(assistantId);
        if (success) {
          toast({
            title: ASSISTANT_SUCCESS_MESSAGES.ASSISTANT_ADDED.title,
            description: ASSISTANT_SUCCESS_MESSAGES.ASSISTANT_ADDED.description(
              assistant.name
            ),
            variant: "success",
          });
          localStorage.removeItem("assistantFormData");
          await refreshAssistants();
          setLoading(false);

          router.refresh();
        } else {
          toast({
            title: ASSISTANT_ERROR_MESSAGES.ASSISTANT_ADD_FAILED.title,
            description:
              ASSISTANT_ERROR_MESSAGES.ASSISTANT_ADD_FAILED.description(
                assistant.name
              ),
            variant: "destructive",
          });
        }
      }

      localStorage.removeItem("assistantFormData");
      await refreshAssistants();
      const redirectUrl =
        redirectType === SuccessfulAssistantUpdateRedirectType.ADMIN
          ? teamspaceId
            ? `/t/${teamspaceId}/admin/assistants`
            : `/admin/assistants`
          : teamspaceId
            ? `/t/${teamspaceId}/chat?assistantId=${assistantId}`
            : `/chat?assistantId=${assistantId}`;

      router.push(redirectUrl);
      setIsRequestSuccessful(true);
    }
  };

  useEffect(() => {
    const subscription = form.watch((values) => {
      localStorage.setItem("assistantFormData", JSON.stringify(values));
    });

    return () => subscription.unsubscribe();
  }, [form]);

  function toggleToolInValues(toolId: number) {
    const updatedEnabledToolsMap = {
      ...form.getValues("enabled_tools_map"),
      [toolId]: !form.getValues("enabled_tools_map")[toolId],
    };
    form.setValue("enabled_tools_map", updatedEnabledToolsMap);
  }

  function searchToolEnabled() {
    return searchTool && form.getValues("enabled_tools_map")[searchTool.id]
      ? true
      : false;
  }

  const currentLLMSupportsImageOutput = checkLLMSupportsImageOutput(
    providerDisplayNameToProviderName.get(
      form.getValues("llm_model_provider_override") || ""
    ) ||
      defaultProviderName ||
      "",
    form.getValues("llm_model_version_override") || defaultModelName || ""
  );

  const values = form.getValues();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "starter_messages",
  });

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex justify-center w-full gap-x-2">
            <Popover
              open={isIconDropdownOpen}
              onOpenChange={setIsIconDropdownOpen}
              content={
                <div
                  className="flex p-1 border-2 border-dashed rounded-full cursor-pointer border-border"
                  style={{
                    borderStyle: "dashed",
                    borderWidth: "1.5px",
                    borderSpacing: "4px",
                  }}
                  onClick={() => setIsIconDropdownOpen(!isIconDropdownOpen)}
                >
                  {values.uploaded_image ? (
                    <img
                      src={URL.createObjectURL(values.uploaded_image)}
                      alt="Uploaded assistant icon"
                      className="object-cover w-12 h-12 rounded-full"
                    />
                  ) : existingAssistant?.uploaded_image_id &&
                    !removeAssistantImage ? (
                    <img
                      src={buildImgUrl(existingAssistant?.uploaded_image_id)}
                      alt="Uploaded assistant icon"
                      className="object-cover w-12 h-12 rounded-full"
                    />
                  ) : (
                    createSVG(
                      {
                        encodedGrid: values.icon_shape
                          ? values.icon_shape
                          : defaultIconShape,
                        filledSquares: 0,
                      },
                      values.icon_color ? values.icon_color : defautIconColor,
                      undefined,
                      true
                    )
                  )}
                </div>
              }
              popover={
                <div className="bg-white text-text-800 flex flex-col gap-y-1 w-[300px] border border-border rounded-lg shadow-lg p-2">
                  <label className="flex items-center w-full px-4 py-2 text-left rounded cursor-pointer gap-x-2 hover:bg-background-100">
                    <CameraIcon />
                    Upload {values.uploaded_image && " New "} Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          form.setValue("uploaded_image", file);
                          setIsIconDropdownOpen(false);
                        }
                      }}
                    />
                  </label>

                  {values.uploaded_image && (
                    <Button
                      onClick={() => {
                        form.setValue("uploaded_image", null);
                        setRemoveAssistantImage(false);
                      }}
                      variant="destructive"
                      type="button"
                    >
                      <TrashIcon />
                      {removeAssistantImage ? "Revert to Previous " : "Remove "}
                      Image
                    </Button>
                  )}

                  {!values.uploaded_image &&
                    (!existingAssistant?.uploaded_image_id ||
                      removeAssistantImage) && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newShape = generateRandomIconShape();
                          const randomColor =
                            colorOptions[
                              Math.floor(Math.random() * colorOptions.length)
                            ];
                          form.setValue("icon_shape", newShape.encodedGrid);
                          form.setValue("icon_color", randomColor);
                        }}
                        type="button"
                      >
                        <NewChatIcon />
                        Generate New Icon
                      </Button>
                    )}

                  {existingAssistant?.uploaded_image_id &&
                    removeAssistantImage &&
                    !values.uploaded_image && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRemoveAssistantImage(false);
                          form.setValue("uploaded_image", null);
                        }}
                        type="button"
                      >
                        <SwapIcon />
                        Revert to Previous Image
                      </Button>
                    )}

                  {existingAssistant?.uploaded_image_id &&
                    !removeAssistantImage &&
                    !values.uploaded_image && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRemoveAssistantImage(true);
                        }}
                        variant="destructive"
                        type="button"
                      >
                        <TrashIcon />
                        Remove Image
                      </Button>
                    )}
                </div>
              }
              align="start"
              side="bottom"
            />

            <CustomTooltip trigger={<FiInfo size={12} />}>
              This icon will visually represent your Assistant
            </CustomTooltip>
          </div>

          <InputForm
            formControl={form.control}
            name="name"
            tooltip="Used to identify the Assistant in the UI."
            label="Name"
            placeholder="e.g. 'Email Assistant'"
          />

          <InputForm
            formControl={form.control}
            tooltip="Used for identifying assistants and their use cases."
            name="description"
            label="Description"
            placeholder="e.g. 'Use this Assistant to help draft professional emails'"
          />

          <InputForm
            formControl={form.control}
            tooltip="Gives your assistant a prime directive"
            name="system_prompt"
            label="Instructions"
            isTextarea
            placeholder="e.g. 'You are a professional email writing assistant that always uses a polite enthusiastic tone, emphasizes action items, and leaves blanks for the human to fill in when you have unknowns'"
            onChange={(e) => {
              form.setValue("system_prompt", e.target.value);
              triggerFinalPromptUpdate(
                e.target.value,
                values.task_prompt,
                searchToolEnabled()
              );
            }}
            className="h-40 max-h-80"
          />

          <div>
            <div className="flex items-center gap-x-2 pt-6">
              <div className="block text-base font-medium">
                Default AI Model{" "}
              </div>
              <CustomTooltip trigger={<FiInfo size={12} />}>
                Select a Large Language Model (Generative AI model) to power
                this Assistant
              </CustomTooltip>
            </div>
            <p className="my-1 text-sm text-subtle">
              Your assistant will use the user&apos;s set default unless
              otherwise specified below.
              {admin &&
                user?.preferences.default_model &&
                `  Your current (user-specific) default model is ${getDisplayNameForModel(destructureValue(user?.preferences?.default_model!).modelName)}`}
            </p>
            {admin ? (
              <div className="flex mb-2 items-start">
                {/* TODO: for assistant page */}
                {/* <div className="w-96">
                  <FormField
                    control={form.control}
                    name="llm_model_provider_override"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <SelectorFormField
                            defaultValue={`User default`}
                            name="llm_model_provider_override"
                            options={llmProviders.map((llmProvider) => ({
                              name: llmProvider.name,
                              value: llmProvider.name,
                              icon: llmProvider.icon,
                            }))}
                            includeDefault={true}
                            onSelect={(selected) => {
                              if (
                                selected !== values.llm_model_provider_override
                              ) {
                                form.setValue(
                                  "llm_model_version_override",
                                  null
                                );
                              }
                              form.setValue(
                                "llm_model_provider_override",
                                selected
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {values.llm_model_provider_override && (
                  <div className="ml-4 w-96">
                    <FormField
                      control={form.control}
                      name="llm_model_version_override"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <SelectorFormField
                              name="llm_model_version_override"
                              options={
                                modelOptionsByProvider.get(
                                  values.llm_model_provider_override || ""
                                ) || []
                              }
                              maxHeight="max-h-72"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )} */}
              </div>
            ) : (
              <div className="max-w-sm">
                <Controller
                  name="llm_model_version_override"
                  control={form.control}
                  render={({ field: { value, onChange } }) => (
                    <LlmList
                      scrollable
                      userDefault={
                        user?.preferences?.default_model
                          ? destructureValue(user?.preferences?.default_model)
                              .modelName
                          : null
                      }
                      llmProviders={llmProviders}
                      currentLlm={values.llm_model_version_override || ""}
                      onSelect={(selectedValue: string | null) => {
                        if (selectedValue !== null) {
                          const { modelName, provider, name } =
                            destructureValue(selectedValue);
                          onChange(modelName);
                          form.setValue(
                            "llm_model_version_override",
                            modelName
                          );
                          form.setValue("llm_model_provider_override", name);
                        } else {
                          onChange(null);
                          form.setValue("llm_model_version_override", null);
                          form.setValue("llm_model_provider_override", null);
                        }
                      }}
                    />
                  )}
                />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-x-2 pt-6">
              <div className="block text-base font-medium">Capabilities </div>
              <CustomTooltip trigger={<FiInfo size={12} />}>
                You can give your assistant advanced capabilities like image
                generation
              </CustomTooltip>
              <div className="block text-sm font-description text-subtle">
                Advanced
              </div>
            </div>

            <div className="flex flex-col pt-6 ml-1 gap-y-4">
              {imageGenerationTool && (
                <CustomTooltip
                  trigger={
                    <div
                      className={`w-fit ${
                        !currentLLMSupportsImageOutput
                          ? "opacity-70 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <CheckboxForm
                        formControl={form.control}
                        name={`enabled_tools_map.${imageGenerationTool.id}`}
                        label="Image Generation Tool"
                        onChange={() => {
                          toggleToolInValues(imageGenerationTool.id);
                        }}
                        disabled={!currentLLMSupportsImageOutput}
                      />
                    </div>
                  }
                  asChild
                  open={currentLLMSupportsImageOutput ? false : undefined}
                >
                  {!currentLLMSupportsImageOutput && (
                    <p>
                      To use Image Generation, select GPT-4o or another image
                      compatible model as the default model for this Assistant.
                    </p>
                  )}
                </CustomTooltip>
              )}

              {searchTool && (
                <CustomTooltip
                  trigger={
                    <div
                      className={`w-fit ${
                        ccPairs.length === 0
                          ? "opacity-70 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <CheckboxForm
                        formControl={form.control}
                        name={`enabled_tools_map.${searchTool.id}`}
                        label="Search Tool"
                        onChange={() => {
                          form.setValue("num_chunks", 0);
                          toggleToolInValues(searchTool.id);
                        }}
                        disabled={ccPairs.length === 0}
                      />
                    </div>
                  }
                  asChild
                  open={ccPairs.length === 0 ? undefined : false}
                >
                  {ccPairs.length === 0 && (
                    <p>
                      To use the Search Tool, you need to have at least one
                      Connector-Credential pair configured.
                    </p>
                  )}
                </CustomTooltip>
              )}

              {ccPairs.length > 0 && searchTool && (
                <>
                  {searchToolEnabled() && (
                    <CollapsibleSection prompt="Configure Search">
                      <div>
                        {ccPairs.length > 0 && (
                          <>
                            <Label small>Document Sets</Label>
                            <div>
                              <SubLabel>
                                <>
                                  Select which{" "}
                                  {!user || user.role === "admin" ? (
                                    <Link
                                      href={
                                        teamspaceId
                                          ? `/t/${teamspaceId}/admin/documents/sets`
                                          : "/admin/documents/sets"
                                      }
                                      className="text-blue-500"
                                      target="_blank"
                                    >
                                      Document Sets
                                    </Link>
                                  ) : (
                                    "Document Sets"
                                  )}{" "}
                                  this Assistant should search through. If none
                                  are specified, the Assistant will search
                                  through all available documents in order to
                                  try and respond to queries.
                                </>
                              </SubLabel>
                            </div>
                            {documentSets.filter(
                              (documentSet) => documentSet.is_public
                            ).length > 0 ? (
                              <Controller
                                name="document_set_ids"
                                control={form.control}
                                render={({ field }) => (
                                  <div className="flex flex-wrap gap-2 mt-2 mb-3 text-sm">
                                    {documentSets
                                      .filter(
                                        (documentSet) => documentSet.is_public
                                      )
                                      .map((documentSet) => {
                                        const isSelected = field.value.includes(
                                          documentSet.id
                                        );

                                        return (
                                          <DocumentSetSelectable
                                            key={documentSet.id}
                                            documentSet={documentSet}
                                            isSelected={isSelected}
                                            onSelect={() => {
                                              if (isSelected) {
                                                field.onChange(
                                                  field.value.filter(
                                                    (id: number) =>
                                                      id !== documentSet.id
                                                  )
                                                );
                                              } else {
                                                field.onChange([
                                                  ...field.value,
                                                  documentSet.id,
                                                ]);
                                              }
                                            }}
                                          />
                                        );
                                      })}
                                  </div>
                                )}
                              />
                            ) : (
                              <i className="text-sm">
                                No Public Document Sets available.{" "}
                                {user?.role !== "admin" && (
                                  <>
                                    If this functionality would be useful, reach
                                    out to the administrators of Arnold AI for
                                    assistance.
                                  </>
                                )}
                              </i>
                            )}

                            <div className="flex flex-col mt-4 gap-y-4">
                              <InputForm
                                formControl={form.control}
                                name="num_chunks"
                                label="Number of Context Documents"
                                tooltip="How many of the top matching document sections to feed the LLM for context when generating a response"
                                placeholder="Defaults to 10"
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === "" || /^[0-9]+$/.test(value)) {
                                    form.setValue(
                                      "num_chunks",
                                      value === "" ? 10 : Number(value)
                                    );
                                  }
                                }}
                                value={form.watch("num_chunks") || 10}
                              />

                              <DatePicker
                                formControl={form.control}
                                name="search_start_date"
                              />

                              <CheckboxForm
                                formControl={form.control}
                                name="llm_relevance_filter"
                                label="Apply LLM Relevance Filter"
                                description="If enabled, the LLM will filter out chunks that are not relevant to the user query."
                              />

                              <CheckboxForm
                                formControl={form.control}
                                name="include_citations"
                                label="Include Citations"
                                description="If set, the response will include bracket citations ([1], [2], etc.)
                                      for each document used by the LLM to help inform the response. This is
                                      the same technique used by the default Assistants. In general, we recommend
                                      to leave this enabled in order to increase trust in the LLM answer."
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}
                </>
              )}

              {internetSearchTool && (
                <CheckboxForm
                  formControl={form.control}
                  name={`enabled_tools_map.${internetSearchTool.id}`}
                  label={internetSearchTool.display_name}
                  onChange={() => {
                    toggleToolInValues(internetSearchTool.id);
                  }}
                />
              )}

              {customTools.length > 0 && (
                <>
                  {customTools.map((tool) => (
                    <CheckboxForm
                      formControl={form.control}
                      key={tool.id}
                      name={`enabled_tools_map.${tool.id}`}
                      label={tool.name}
                      description={tool.description}
                      onChange={() => {
                        toggleToolInValues(tool.id);
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
          <Divider />
          <AdvancedOptionsToggle
            showAdvancedOptions={showAdvancedOptions}
            setShowAdvancedOptions={setShowAdvancedOptions}
          />

          {showAdvancedOptions && (
            <>
              {llmProviders.length > 0 && (
                <>
                  <InputForm
                    formControl={form.control}
                    name="task_prompt"
                    label="Reminders (Optional)"
                    isTextarea
                    placeholder="e.g. 'Remember to reference all of the points mentioned in my message to you and focus on identifying action items that can move things forward'"
                    onChange={(e) => {
                      form.setValue("task_prompt", e.target.value);
                      triggerFinalPromptUpdate(
                        values.system_prompt,
                        e.target.value,
                        searchToolEnabled()
                      );
                    }}
                    className="h-40 max-h-80"
                    description="Learn about prompting in our docs!"
                  />
                </>
              )}

              <div className="flex flex-col mb-6">
                <div className="flex items-center gap-x-2">
                  <div className="block text-base font-medium">
                    Starter Messages (Optional)
                  </div>
                </div>
                {fields.map((item, index) => (
                  <div key={index} className={index === 0 ? "mt-2" : "mt-6"}>
                    <div className="flex">
                      <Card className="mr-4">
                        <CardContent className="space-y-4">
                          <InputForm
                            formControl={form.control}
                            label="Name"
                            description={
                              <>
                                Shows up as the &quot;title&quot; for this
                                Starter Message. For example, &quot;Write an
                                email&quot;.
                              </>
                            }
                            name={`starter_messages.${index}.name`}
                            onChange={(e) =>
                              form.setValue(
                                `starter_messages.${index}.name`,
                                e.target.value
                              )
                            }
                          />

                          <InputForm
                            formControl={form.control}
                            label="Description"
                            description={
                              <>
                                A description which tells the user what they
                                might want to use this Starter Message for. For
                                example &quot;to a client about a new
                                feature&quot;
                              </>
                            }
                            name={`starter_messages.${index}.description`}
                            onChange={(e) =>
                              form.setValue(
                                `starter_messages.${index}.description`,
                                e.target.value
                              )
                            }
                          />

                          <InputForm
                            formControl={form.control}
                            label="Message"
                            description={
                              <>
                                The actual message to be sent as the initial
                                user message if a user selects this starter
                                prompt. For example, &quot;Write me an email to
                                a client about a new billing feature we just
                                released.&quot;
                              </>
                            }
                            name={`starter_messages.${index}.message`}
                            onChange={(e) =>
                              form.setValue(
                                `starter_messages.${index}.message`,
                                e.target.value
                              )
                            }
                            className="min-h-40 max-h-80"
                            isTextarea
                          />
                        </CardContent>
                      </Card>
                      <div className="my-auto">
                        <CustomTooltip
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              onClick={() => remove(index)}
                            >
                              <FiX />
                            </Button>
                          }
                          variant="destructive"
                        >
                          Remove
                        </CustomTooltip>
                      </div>
                    </div>
                  </div>
                ))}

                <div>
                  <Button
                    type="button"
                    className="mt-3"
                    onClick={() =>
                      append({ name: "", description: "", message: "" })
                    }
                  >
                    <Plus size={16} /> Add New
                  </Button>
                </div>
              </div>

              {!teamspaceId && (
                <IsPublicGroupSelector2
                  formControl={form.control}
                  objectName="assistant"
                  enforceGroupSelection={false}
                  checkboxName="is_public"
                  comboboxName="groups"
                  values={values}
                  setValue={form.setValue}
                />
              )}
            </>
          )}

          <div className="flex pt-6">
            <Button
              className="mx-auto"
              type="submit"
              disabled={form.formState.isSubmitting || loading}
            >
              {isUpdate ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
