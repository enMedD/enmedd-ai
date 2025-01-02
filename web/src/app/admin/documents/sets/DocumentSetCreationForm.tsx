"use client";

import { ConnectorIndexingStatus, DocumentSet, Teamspace } from "@/lib/types";
import { createDocumentSet, updateDocumentSet } from "./lib";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import {
  CheckboxForm,
  ComboboxForm,
  InputForm,
} from "@/components/admin/connectors/Field";
import { DOCUMENT_SET_SUCCESS_MESSAGES } from "@/constants/success";
import { DOCUMENT_SET_ERROR_MESSAGES } from "@/constants/error";

interface SetCreationPopupProps {
  ccPairs: ConnectorIndexingStatus<any, any>[];
  teamspaces: Teamspace[] | undefined;
  onClose: () => void;
  existingDocumentSet?: DocumentSet;
  teamspaceId?: string | string[];
}

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Please enter a name for the set",
  }),
  description: z.string().min(1, {
    message: "Please enter a description for the set",
  }),
  cc_pair_ids: z.array(z.number()).min(1, {
    message: "Please select at least one connector",
  }),
  is_public: z.boolean(),
  groups: z.array(z.number()).optional(),
  users: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const DocumentSetCreationForm = ({
  ccPairs,
  teamspaces,
  onClose,
  existingDocumentSet,
  teamspaceId,
}: SetCreationPopupProps) => {
  const { toast } = useToast();
  const isUpdate = existingDocumentSet !== undefined;

  const cachedFormData = JSON.parse(
    localStorage.getItem("documentSetFormData") || "{}"
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingDocumentSet?.name ?? cachedFormData?.name ?? "",
      description:
        existingDocumentSet?.description ?? cachedFormData?.description ?? "",
      cc_pair_ids:
        existingDocumentSet?.cc_pair_descriptors.map(
          (ccPairDescriptor) => ccPairDescriptor.id
        ) ??
        cachedFormData?.cc_pair_ids ??
        [],
      is_public:
        existingDocumentSet?.is_public ?? cachedFormData?.is_public ?? true,
      users: existingDocumentSet?.users ?? cachedFormData?.users ?? [],
      groups:
        existingDocumentSet?.groups.map((group) => group.id) ??
        cachedFormData?.groups ??
        [],
    },
  });

  const connectorItems = ccPairs
    .filter((ccPair) => teamspaceId || ccPair.access_type !== "private")
    .map((ccPair) => ({
      value: ccPair.cc_pair_id.toString(),
      label: ccPair.name || `Connector ${ccPair.cc_pair_id}`,
    }));

  useEffect(() => {
    const subscription = form.watch((values) => {
      localStorage.setItem("documentSetFormData", JSON.stringify(values));
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (teamspaceId) {
      form.setValue("is_public", false);
    }
  }, [teamspaceId, form]);

  const onSubmit = async (values: FormValues) => {
    const processedValues = {
      ...values,
      groups: teamspaceId
        ? [Number(teamspaceId)]
        : values.is_public
          ? []
          : (values.groups ?? []),
      users: values.users ?? [],
    };

    let response;
    if (isUpdate) {
      response = await updateDocumentSet({
        id: existingDocumentSet.id,
        ...processedValues,
        users: processedValues.users,
      });
    } else {
      response = await createDocumentSet(processedValues);
    }

    if (response.ok) {
      toast({
        title: DOCUMENT_SET_SUCCESS_MESSAGES.UPDATE_CREATE.title(isUpdate),
        description:
          DOCUMENT_SET_SUCCESS_MESSAGES.UPDATE_CREATE.description(isUpdate),
        variant: "success",
      });
      onClose();
      localStorage.removeItem("documentSetFormData");
    } else {
      const errorMsg = await response.text();
      toast({
        title: DOCUMENT_SET_ERROR_MESSAGES.UPDATE_CREATE.title,
        description: DOCUMENT_SET_ERROR_MESSAGES.UPDATE_CREATE.description(
          isUpdate,
          errorMsg
        ),
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Field */}
        <InputForm
          formControl={form.control}
          name="name"
          label="Name"
          placeholder="A name for the document set"
          disabled={isUpdate}
        />

        {/* Description Field */}
        <InputForm
          formControl={form.control}
          name="description"
          label="Description"
          placeholder="Describe what the document set represents"
        />

        <ComboboxForm
          formControl={form.control}
          name="cc_pair_ids"
          label="Pick your connectors"
          comboboxLabel="Select data sources"
          placeholder="Search connectors"
          items={connectorItems}
        />

        {/* Teamspace Selection */}
        {teamspaces && teamspaces.length > 0 && !teamspaceId && (
          <div>
            <CheckboxForm
              formControl={form.control}
              name="is_public"
              label="Is Public?"
              description={
                <>
                  If the document set is public, it will be visible to{" "}
                  <b>all users</b>. If not, only users in the specified
                  teamspace will be able to see it.
                </>
              }
            />

            {!form.getValues("is_public") && (
              <>
                <h3 className="mb-1 text-sm">Teamspace with Access</h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  If any teamspaces are specified, this Document Set will be
                  visible only to them. If none, it will be visible to all
                  users.
                </p>
                <ComboboxForm
                  formControl={form.control}
                  name="groups"
                  comboboxLabel="Teamspaces"
                  placeholder="Search connectors"
                  items={teamspaces.map((teams) => ({
                    value: teams.id.toString(),
                    label: teams.name,
                  }))}
                />
              </>
            )}
          </div>
        )}

        <div className="flex pt-6">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-64 mx-auto"
          >
            {isUpdate ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
