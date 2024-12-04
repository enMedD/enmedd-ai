"use client";

import { ConnectorIndexingStatus, DocumentSet, Teamspace } from "@/lib/types";
import { createDocumentSet, updateDocumentSet } from "./lib";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Combobox } from "@/components/Combobox";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "@/components/ui/form";

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingDocumentSet?.name ?? "",
      description: existingDocumentSet?.description ?? "",
      cc_pair_ids:
        existingDocumentSet?.cc_pair_descriptors.map(
          (ccPairDescriptor) => ccPairDescriptor.id
        ) ?? [],
      is_public: existingDocumentSet?.is_public ?? true,
      users: existingDocumentSet?.users ?? [],
      groups: existingDocumentSet?.groups.map((group) => group.id) ?? [],
    },
  });

  const connectorItems = ccPairs
    .filter((ccPair) => ccPair.access_type !== "private")
    .map((ccPair) => ({
      value: ccPair.cc_pair_id.toString(),
      label: ccPair.name || `Connector ${ccPair.cc_pair_id}`,
    }));

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
        title: isUpdate ? "Document Set Updated" : "New Document Set Created",
        description: isUpdate
          ? "Your document set has been updated successfully."
          : "Your new document set has been created successfully.",
        variant: "success",
      });
      onClose();
    } else {
      const errorMsg = await response.text();
      toast({
        title: "Action Failed",
        description: isUpdate
          ? `Failed to update document set: ${errorMsg}`
          : `Failed to create document set: ${errorMsg}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="A name for the document set"
                  disabled={isUpdate}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  placeholder="Describe what the document set represents"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cc_pair_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pick your connectors</FormLabel>
              <FormControl>
                <Combobox
                  items={connectorItems}
                  onSelect={(selectedValues) => {
                    const selectedIds = selectedValues.map((val) =>
                      parseInt(val, 10)
                    );
                    field.onChange(selectedIds);
                  }}
                  placeholder="Search connectors"
                  label="Select data sources"
                  selected={field.value.map((id) => id.toString())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Teamspace Selection */}
        {teamspaces && teamspaces.length > 0 && !teamspaceId && (
          <div>
            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                      }}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 !mb-3 !space-y-1.5">
                    <span>Is Public?</span>
                    <p className="text-sm text-muted-foreground font-normal">
                      If the document set is public, it will be visible to{" "}
                      <b>all users</b>. If not, only users in the specified
                      teamspace will be able to see it.
                    </p>
                  </FormLabel>
                </FormItem>
              )}
            />
            {!form.getValues("is_public") && (
              <>
                <h3 className="mb-1 text-sm">Teamspace with Access</h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  If any teamspaces are specified, this Document Set will be
                  visible only to them. If none, it will be visible to all
                  users.
                </p>
                <FormField
                  control={form.control}
                  name="groups"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teamspaces</FormLabel>
                      <FormControl>
                        <Combobox
                          items={teamspaces.map((teams) => ({
                            value: teams.id.toString(),
                            label: teams.name,
                          }))}
                          onSelect={(selectedTeamspaceIds) => {
                            const selectedIds = selectedTeamspaceIds.map(
                              (val) => parseInt(val, 10)
                            );
                            field.onChange(selectedIds);
                          }}
                          placeholder="Select teamspaces"
                          label="Teamspaces"
                          selected={field.value?.map((id) => id.toString())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
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
