import { createApiKey, updateApiKey } from "./lib";
import { UserRole } from "@/lib/types";
import { APIKey, APIKeyArgs } from "./types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface EnmeddApiKeyFormProps {
  onClose: () => void;
  onCreateApiKey: (apiKey: APIKey) => void;
  apiKey?: APIKey;
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
}: EnmeddApiKeyFormProps) => {
  const isUpdate = Boolean(apiKey);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: apiKey?.api_key_name || "",
      is_admin: apiKey?.api_key_role === UserRole.ADMIN,
    },
  });

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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel htmlFor="name">Name</FormLabel>
              <FormControl>
                <Input
                  id="name"
                  placeholder="Enter a name for the API key"
                  disabled={isUpdate}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Is Admin Checkbox */}
        <FormField
          control={form.control}
          name="is_admin"
          render={({ field }) => (
            <FormItem className="flex gap-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(Boolean(checked))
                  }
                />
              </FormControl>
              <FormLabel className="!mt-0 !mb-3 !space-y-1.5">
                Is Admin?
                <p className="text-sm text-muted-foreground font-normal">
                  Grant admin-level access to the server APIs.
                </p>
              </FormLabel>
            </FormItem>
          )}
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
