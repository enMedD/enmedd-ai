import { SettingsContext } from "@/components/settings/SettingsProvider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OPERATION_ERROR_MESSAGES } from "@/constants/error";
import { SMTP_SETTINGS_SUCCESS_MESSAGES } from "@/constants/success";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  smtp_server: z.string().min(1, "SMTP Server is required."),
  smtp_port: z
    .number({ invalid_type_error: "SMTP Port must be a number." })
    .int("SMTP Port must be an integer.")
    .positive("SMTP Port must be a positive number."),
  smtp_username: z.string().min(1, "SMTP Username is required."),
  smtp_password: z.string().min(1, "SMTP Password is required."),
});

type FormValues = z.infer<typeof formSchema>;

export function SMTP() {
  const settings = useContext(SettingsContext);
  if (!settings) {
    return null;
  }
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    smtp_server: settings.settings.smtp_server,
    smtp_port: settings.settings.smtp_port,
    smtp_username: settings.settings.smtp_username,
    smtp_password: settings.settings.smtp_password,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      smtp_server: settings.settings.smtp_server || "",
      smtp_port: settings.settings.smtp_port || 0,
      smtp_username: settings.settings.smtp_username || "",
      smtp_password: settings.settings.smtp_password || "",
    },
  });

  async function updateSmtpSettings(workspaceId: number, smtpSettings: any) {
    setLoading(true);
    const response = await fetch(
      `/api/admin/settings/workspace/${workspaceId}/smtp`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(smtpSettings),
      }
    );

    setLoading(false);
    if (response.ok) {
      toast({
        title: SMTP_SETTINGS_SUCCESS_MESSAGES.UPDATE.title,
        description: SMTP_SETTINGS_SUCCESS_MESSAGES.UPDATE.description,
        variant: "success",
      });
    } else {
      const errorMsg = (await response.json()).detail;
      toast({
        title: OPERATION_ERROR_MESSAGES.ACTION.title("Update"),
        description: OPERATION_ERROR_MESSAGES.ACTION.description(
          "SMTP",
          "update",
          errorMsg
        ),
        variant: "destructive",
      });
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const onSubmit = async (data: FormValues) => {
    setIsEditing(false);
    await updateSmtpSettings(0, data);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      smtp_server: settings.settings.smtp_server,
      smtp_port: settings.settings.smtp_port,
      smtp_username: settings.settings.smtp_username,
      smtp_password: settings.settings.smtp_password,
    });
    form.reset({
      smtp_server: settings.settings.smtp_server || "",
      smtp_port: settings.settings.smtp_port || 0,
      smtp_username: settings.settings.smtp_username || "",
      smtp_password: settings.settings.smtp_password || "",
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex gap-5 flex-col md:flex-row py-8 border-t mt-16"
      >
        <div className="leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
          <Label
            htmlFor="workspace_description"
            className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
          >
            SMTP
          </Label>
          <p className="text-sm text-muted-foreground pb-1.5 md:w-4/5">
            Enables the exchange of emails between servers.
          </p>
        </div>

        <div className="md:w-[500px]">
          <div className="flex flex-col items-end">
            <div className="w-full flex flex-col gap-4">
              {isEditing ? (
                <>
                  <FormField
                    control={form.control}
                    name="smtp_server"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Server</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter hostname"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleChange(e);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smtp_port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Port</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter port"
                            {...field}
                            type="number"
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              field.onChange(value);
                              handleChange(e);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smtp_username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Username (email)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter username"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleChange(e);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smtp_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Password</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter password"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleChange(e);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <>
                  <div className="flex gap-6">
                    <span className="whitespace-nowrap">SMTP Server:</span>
                    <span className="font-semibold text-inverted-inverted w-full truncate">
                      {loading
                        ? "Syncing"
                        : settings.settings.smtp_server || "None"}
                    </span>
                  </div>

                  <div className="flex gap-6">
                    <span className="whitespace-nowrap">SMTP Port:</span>
                    <span className="font-semibold text-inverted-inverted w-full truncate">
                      {loading
                        ? "Syncing"
                        : settings.settings.smtp_port || "None"}
                    </span>
                  </div>

                  <div className="flex gap-6">
                    <span className="whitespace-nowrap">
                      SMTP Username (email):
                    </span>
                    <span className="font-semibold text-inverted-inverted w-full truncate">
                      {loading
                        ? "Syncing"
                        : settings.settings.smtp_username || "None"}
                    </span>
                  </div>

                  <div className="flex gap-6">
                    <span className="whitespace-nowrap">SMTP Password:</span>
                    <span className="font-semibold text-inverted-inverted truncate">
                      {loading
                        ? "Syncing"
                        : settings.settings.smtp_password
                          ? "●●●●●●●●"
                          : "None"}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-end">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={handleCancel}
                      disabled={form.formState.isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        form.formState.isSubmitting ||
                        JSON.stringify(formData) ===
                          JSON.stringify({
                            smtp_server: settings.settings.smtp_server,
                            smtp_port: settings.settings.smtp_port,
                            smtp_username: settings.settings.smtp_username,
                            smtp_password: settings.settings.smtp_password,
                          })
                      }
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    type="button"
                    variant="outline"
                    disabled={form.formState.isSubmitting}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
