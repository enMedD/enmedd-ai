"use client";

import {
  ConnectorIndexingStatus,
  User,
  Teamspace,
  DocumentSet,
} from "@/lib/types";
import { UserSelector } from "./UserSelector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Assistant } from "@/app/admin/assistants/interfaces";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/app/admin/settings/ImageUpload";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { createTeamspace } from "./lib";
import { ComboboxForm, InputForm } from "@/components/admin/connectors/Field";
import {
  TEAMSPACE_ASSISTANT_ERROR_MESSAGES,
  TEAMSPACE_CREATION_ERROR_MESSAGES,
} from "@/constants/error";
import { TEAMSPACE_CREATION_SUCCESS_MESSAGES } from "@/constants/success";

interface TeamspaceCreationFormProps {
  onClose: () => void;
  users: User[];
  ccPairs: ConnectorIndexingStatus<any, any>[];
  existingTeamspace?: Teamspace;
  assistants: Assistant[];
  documentSets: DocumentSet[] | undefined;
}

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Please enter a name for the teamspace",
  }),
  description: z.string().min(1, {
    message: "Please enter a description for the teamspace",
  }),
  users: z
    .array(
      z.object({
        user_id: z.string().min(1, { message: "User ID cannot be empty" }),
        role: z.string().min(1, { message: "Role cannot be empty" }),
      })
    )
    .min(1, { message: "Please select at least one user with a role" }),
  assistant_ids: z.array(z.number()).min(1, {
    message: "Please select at least one assistant",
  }),
  document_set_ids: z.array(z.number()).optional(),
  cc_pair_ids: z.array(z.number()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const TeamspaceCreationForm = ({
  onClose,
  users,
  ccPairs,
  existingTeamspace,
  assistants,
  documentSets,
}: TeamspaceCreationFormProps) => {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File | null>(null);
  // const [tokenBudget, setTokenBudget] = useState(0);
  // const [periodHours, setPeriodHours] = useState(0);
  const isUpdate = existingTeamspace !== undefined;
  const { toast } = useToast();

  const cachedFormData = JSON.parse(
    localStorage.getItem("teamspaceFormData") || "{}"
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: cachedFormData?.name ?? existingTeamspace?.name ?? "",
      description:
        cachedFormData?.description ?? existingTeamspace?.description ?? "",
      users: cachedFormData?.users ?? existingTeamspace?.users ?? [],
      assistant_ids:
        cachedFormData?.assistant_ids ??
        existingTeamspace?.assistants?.map((assistant) => assistant.id) ??
        [],
      document_set_ids:
        cachedFormData?.document_set_ids ??
        existingTeamspace?.document_sets?.map((docSet) => docSet.id) ??
        [],
      cc_pair_ids:
        cachedFormData?.cc_pair_ids ??
        existingTeamspace?.cc_pairs?.map((cc_pair) => cc_pair.id) ??
        [],
    },
  });

  useEffect(() => {
    const subscription = form.watch((values) => {
      localStorage.setItem("teamspaceFormData", JSON.stringify(values));
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const uploadLogo = async (teamspaceId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `/api/manage/admin/teamspace/logo?teamspace_id=${teamspaceId}`,
      {
        method: "PUT",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorMsg =
        (await response.json()).detail || "Failed to upload logo.";
      throw new Error(errorMsg);
    }

    return response.json();
  };

  const onSubmit = async (values: FormValues) => {
    if (values.users.length === 0) {
      toast({
        title: TEAMSPACE_CREATION_ERROR_MESSAGES.TITLE,
        description: TEAMSPACE_CREATION_ERROR_MESSAGES.NO_USER.description,
        variant: "destructive",
      });
      return;
    }

    const hasAdmin = values.users.some(
      (user) => user.role.toLowerCase() === "admin"
    );
    if (!hasAdmin) {
      toast({
        title: TEAMSPACE_CREATION_ERROR_MESSAGES.TITLE,
        description: TEAMSPACE_CREATION_ERROR_MESSAGES.NO_ADMIN.description,
        variant: "destructive",
      });
      return;
    }

    if (values.assistant_ids.length === 0) {
      toast({
        title: TEAMSPACE_CREATION_ERROR_MESSAGES.TITLE,
        description:
          TEAMSPACE_ASSISTANT_ERROR_MESSAGES.NO_ASSISTANT.description,
        variant: "destructive",
      });
      return;
    }

    const formattedValues = {
      ...values,
      cc_pair_ids: values.cc_pair_ids?.map((id) => Number(id)) ?? [],
    };

    let response;
    try {
      response = await createTeamspace(formattedValues);

      if (response.ok) {
        const { id } = await response.json();

        if (selectedFiles) {
          await uploadLogo(id, selectedFiles);
        }

        router.refresh();
        toast({
          title:
            TEAMSPACE_CREATION_SUCCESS_MESSAGES.UPDATE_CREATE.title(isUpdate),
          description:
            TEAMSPACE_CREATION_SUCCESS_MESSAGES.UPDATE_CREATE.description(
              isUpdate
            ),
          variant: "success",
        });

        onClose();
        localStorage.removeItem("teamspaceFormData");
      } else {
        const responseJson = await response.json();
        const errorMsg = responseJson.detail || responseJson.message;
        toast({
          title: TEAMSPACE_CREATION_ERROR_MESSAGES.TITLE,
          description:
            TEAMSPACE_CREATION_ERROR_MESSAGES.UPDATE_CREATE.description(
              isUpdate,
              errorMsg
            ),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col justify-between gap-2 pb-4 lg:flex-row">
          <p className="w-1/2 font-semibold whitespace-nowrap">Name*</p>
          <div className="w-full">
            <InputForm
              formControl={form.control}
              name="name"
              placeholder="Teamspace name"
              disabled={isUpdate}
            />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 pb-4 lg:flex-row">
          <p className="w-1/2 font-semibold whitespace-nowrap">Description*</p>
          <div className="w-full">
            <InputForm
              formControl={form.control}
              name="description"
              placeholder="Teamspace description"
              disabled={isUpdate}
              isTextarea
              className="min-h-20 max-h-40"
            />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 lg:flex-row pb-6">
          <p className="w-1/2 font-semibold whitespace-nowrap">Logo</p>
          <div className="flex items-center w-full gap-2">
            <ImageUpload
              selectedFile={selectedFiles}
              setSelectedFile={setSelectedFiles}
            />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 pb-4 lg:flex-row">
          <p className="w-1/2 font-semibold whitespace-nowrap">
            Select members*
          </p>
          <FormField
            control={form.control}
            name="users"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <UserSelector
                    selectedUserIds={field.value.map((user) => user.user_id)}
                    allUsers={users}
                    existingUsers={field.value}
                    onAddUser={(newUser) => {
                      field.onChange([...field.value, newUser]);
                    }}
                    onRemoveUser={(userId) => {
                      field.onChange(
                        field.value.filter((user) => user.user_id !== userId)
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col justify-between gap-2 pb-4 lg:flex-row">
          <p className="w-1/2 font-semibold whitespace-nowrap">
            Select assistants*
          </p>
          <div className="w-full">
            <ComboboxForm
              formControl={form.control}
              name="assistant_ids"
              comboboxLabel="Select assistants"
              placeholder="Select assistants"
              items={assistants
                .filter((assistant) => assistant.is_public)
                .map((assistant) => ({
                  value: assistant.id.toString(),
                  label: assistant.name,
                }))}
              isOnModal
            />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 pb-4 lg:flex-row">
          <p className="w-1/2 font-semibold whitespace-nowrap">
            Select document sets
          </p>
          <div className="w-full">
            <ComboboxForm
              formControl={form.control}
              name="document_set_ids"
              comboboxLabel="Select document set"
              placeholder="Select document set"
              items={
                documentSets
                  ?.filter((docSet) => docSet.is_public)
                  .map((docSet) => ({
                    value: docSet.id.toString(),
                    label: docSet.name,
                  })) || []
              }
              isOnModal
            />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 pb-4 lg:flex-row">
          <p className="w-1/2 font-semibold whitespace-nowrap">
            Select data source
          </p>
          <div className="w-full">
            <ComboboxForm
              formControl={form.control}
              name="cc_pair_ids"
              comboboxLabel="Select data source"
              placeholder="Select data source"
              items={ccPairs
                ?.filter((ccPair) => ccPair.access_type === "public")
                .map((ccPair) => ({
                  value: ccPair.cc_pair_id.toString(),
                  label: ccPair.name || `Connector ${ccPair.cc_pair_id}`,
                }))}
              isOnModal
            />
          </div>
        </div>

        {/*  */}
        {/* <div className="flex flex-col justify-between gap-2 pb-4 lg:flex-row">
                <p className="w-1/2 font-semibold whitespace-nowrap">

                  Set Token Rate Limit
                </p>
                <div className="flex items-center w-full gap-4">
                  <Input
                    placeholder="Time Window (Hours)"
                    type="number"
                    value={periodHours}
                    onChange={(e) => setPeriodHours(Number(e.target.value))}
                  />
                  <Input
                    placeholder="Token Budget (Thousands)"
                    type="number"
                    value={tokenBudget}
                    onChange={(e) => setTokenBudget(Number(e.target.value))}
                  />
                </div>
              </div> */}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            disabled={form.formState.isSubmitting}
            className=""
            onClick={onClose}
            variant="ghost"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {isUpdate ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
