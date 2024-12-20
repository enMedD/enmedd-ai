"use client";

import { createApiKey, updateApiKey } from "./lib";
import { UserRole } from "@/lib/types";
import { APIKey, APIKeyArgs } from "./types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { CheckboxForm, InputForm } from "@/components/admin/connectors/Field";
import { useEffect } from "react";

interface EnmeddApiKeyFormProps {
  onClose: () => void;
  onCreateApiKey: (apiKey: APIKey) => void;
  apiKey?: APIKey;
  isUpdate?: boolean;
}

const formSchema = z.object({
  name: z.string().optional(),
  is_admin: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export const EnmeddApiKeyForm = ({
  onClose,
  onCreateApiKey,
  apiKey,
  isUpdate,
}: EnmeddApiKeyFormProps) => {
  const { toast } = useToast();

  const cachedFormData = JSON.parse(
    localStorage.getItem("apiKeyFormData") || "{}"
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: isUpdate ? apiKey?.api_key_name : cachedFormData.name || "",
      is_admin: isUpdate
        ? apiKey?.api_key_role === UserRole.ADMIN
        : (cachedFormData.is_admin ?? false),
    },
  });

  useEffect(() => {
    const subscription = form.watch((values) => {
      localStorage.setItem("apiKeyFormData", JSON.stringify(values));
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const role: UserRole = values.is_admin ? UserRole.ADMIN : UserRole.BASIC;

      const payload: APIKeyArgs = {
        name: values.name,
        role,
      };

      const response = isUpdate
        ? await updateApiKey(apiKey!.api_key_id, payload)
        : await createApiKey(payload);

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: isUpdate
            ? "API key updated successfully!"
            : "API key created successfully!",
          variant: "success",
        });
        if (!isUpdate) {
          onCreateApiKey(result);
        }
        onClose();
        localStorage.removeItem("apiKeyFormData");
      } else {
        const error = await response.json();
        const errorMessage = error.detail || error.message || "Unknown error";
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to ${
          isUpdate ? "update" : "create"
        } API key: ${error.message}`,
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
          placeholder="Enter a name for the API key"
          disabled={isUpdate}
        />

        {/* Is Admin Checkbox */}
        <CheckboxForm
          formControl={form.control}
          name="is_admin"
          label="Is Admin?"
          description="Grant admin-level access to the server APIs."
        />

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            disabled={form.formState.isSubmitting}
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
