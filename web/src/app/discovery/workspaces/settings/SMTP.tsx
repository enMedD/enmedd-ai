"use client";

import { useState } from "react";
import { InputForm } from "@/components/admin/connectors/Field";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
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
  const { toast } = useToast();
  //   const [formData, setFormData] = useState({
  //     smtp_server: settings.settings.smtp_server,
  //     smtp_port: settings.settings.smtp_port,
  //     smtp_username: settings.settings.smtp_username,
  //     smtp_password: settings.settings.smtp_password,
  //   });
  const [loading, setLoading] = useState(false);
  const [showSMTPSettings, setShowSMTPSettings] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      smtp_server: "",
      smtp_port: 0,
      smtp_username: "",
      smtp_password: "",
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
        title: "SMTP Settings Updated",
        description: "The SMTP settings have been successfully updated.",
        variant: "success",
      });
    } else {
      const errorMsg = (await response.json()).detail;
      toast({
        title: "Failed to update SMTP settings.",
        description: errorMsg,
        variant: "destructive",
      });
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // setFormData((prevData) => ({
    //   ...prevData,
    //   [name]: value,
    // }));
  };

  const onSubmit = async (data: FormValues) => {
    await updateSmtpSettings(0, data);
  };

  return (
    <div className="pt-20 border-t">
      <div className="flex justify-between w-full">
        <div>
          <h2 className="font-bold text-lg md:text-xl">SMTP Configuration</h2>
          <p className="text-sm text-subtle">Manage your email server</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowSMTPSettings((prev) => !prev)}
        >
          {showSMTPSettings ? "Hide SMTP Settings" : "Show SMTP Settings"}
        </Button>
      </div>
      {showSMTPSettings && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="py-8 ">
              <div className="flex gap-5 flex-col md:flex-row items-center">
                <div className="md:w-96 lg:w-60 xl:w-[500px] shrink-0">
                  <Label
                    htmlFor="smtp_server"
                    className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
                  >
                    SMTP Server
                  </Label>
                </div>

                <div className="md:w-[600px]">
                  <InputForm
                    formControl={form.control}
                    name="smtp_server"
                    placeholder="Enter SMTP Server"
                  />
                </div>
              </div>
            </div>

            <div className="py-8 ">
              <div className="flex gap-5 flex-col md:flex-row items-center">
                <div className="md:w-96 lg:w-60 xl:w-[500px] shrink-0">
                  <Label
                    htmlFor="smtp_port"
                    className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
                  >
                    SMTP Port
                  </Label>
                </div>

                <div className="md:w-[600px]">
                  <InputForm
                    formControl={form.control}
                    name="smtp_port"
                    placeholder="Enter SMTP Port"
                    type="number"
                  />
                </div>
              </div>
            </div>

            <div className="py-8 ">
              <div className="flex gap-5 flex-col md:flex-row items-center">
                <div className="md:w-96 lg:w-60 xl:w-[500px] shrink-0">
                  <Label
                    htmlFor="smtp_username"
                    className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
                  >
                    SMTP Username
                  </Label>
                </div>

                <div className="md:w-[600px]">
                  <InputForm
                    formControl={form.control}
                    name="smtp_username"
                    placeholder="Enter SMTP Username"
                  />
                </div>
              </div>
            </div>

            <div className="py-8 ">
              <div className="flex gap-5 flex-col md:flex-row items-center">
                <div className="md:w-96 lg:w-60 xl:w-[500px] shrink-0">
                  <Label
                    htmlFor="smtp_password"
                    className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
                  >
                    SMTP Password
                  </Label>
                </div>

                <div className="md:w-[600px]">
                  <InputForm
                    formControl={form.control}
                    name="smtp_password"
                    placeholder="Enter SMTP Password"
                    type="password"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Save SMTP Settings
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
