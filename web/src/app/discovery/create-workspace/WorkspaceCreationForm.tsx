"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import {
  CheckboxForm,
  ComboboxForm,
  InputForm,
  SubLabel,
} from "@/components/admin/connectors/Field";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/app/admin/settings/ImageUpload";
import Image from "next/image";
import { buildImgUrl } from "@/app/chat/files/images/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";
import Link from "next/link";

const formSchema = z.object({
  workspace_name: z.string().min(1, {
    message: "Please enter a name for the workspace",
  }),
  company_name: z.string().min(1, {
    message: "Please enter a company name for the workspace",
  }),
  description: z.string().min(1, {
    message: "Please enter a description for the workspace",
  }),
  brand_color: z.string(),
  secondary_color: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export default function WorkspaceCreationForm() {
  const { toast } = useToast();
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);

  const cachedFormData = JSON.parse(
    localStorage.getItem("workspaceFormData") || "{}"
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workspace_name: cachedFormData?.workspace_name ?? "",
      company_name: cachedFormData?.company_name ?? "",
      description: cachedFormData?.description ?? "",
      brand_color: "",
      secondary_color: "",
    },
  });

  const onSubmit = async (values: FormValues) => {};

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 pt-20 md:w-3/5 mx-auto"
      >
        <InputForm
          formControl={form.control}
          name="workspace_name"
          label="Workspace name"
          placeholder="Enter workspace name..."
        />
        <InputForm
          formControl={form.control}
          name="company_name"
          label="Company name"
          placeholder="Enter company name..."
        />
        <InputForm
          formControl={form.control}
          name="description"
          label="Workspace description"
          placeholder="Type short description here..."
          isTextarea
          className="min-h-32 max-h-52"
        />

        <div>
          <Label
            htmlFor="custom_header_logo"
            className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-2"
          >
            Company Logo
          </Label>

          <ImageUpload
            selectedFile={selectedLogo}
            setSelectedFile={setSelectedLogo}
          />
          {/* {!selectedHeaderLogo && (
                <div className="space-y-2">
                  <SubLabel>Current Header Logo:</SubLabel>
                  {workspaces?.custom_header_logo ? (
                    <>
                      <img
                        src={buildImgUrl(workspaces?.custom_header_logo)}
                        alt="Logo"
                        className="h-40 object-contain w-40"
                      />
                      <Button
                        variant="destructive"
                        type="button"
                        onClick={deleteHeaderLogo}
                      >
                        Remove
                      </Button>
                    </>
                  ) : (
                    <Image
                      src="/arnold_ai.png"
                      alt="Logo"
                      width={160}
                      height={160}
                      className="h-40 object-contain w-40"
                    />
                  )}
                </div>
              )} */}
        </div>

        <div>
          <div className="flex gap-5 flex-col md:flex-row">
            <div className="leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
              <Label
                htmlFor="workspace_description"
                className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
              >
                Brand Theme
              </Label>
              <p className="text-sm text-muted-foreground pb-1.5 md:w-4/5">
                Select your customized brand color.
              </p>
            </div>

            <div className="md:w-[600px] space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-sm text-subtle w-32">Primary color:</span>
                {/* <div className="flex gap-2">
                  <InputForm
                    formControl={form.control}
                    name="brand_color"
                    onChange={(e) => {
                      form.setValue("brand_color", e.target.value);
                      setPrimaryColor(e.target.value);
                    }}
                    className="w-32"
                  />

                  <Popover>
                    <PopoverTrigger asChild>
                      <div
                        className="w-10 h-10 rounded-full outline-1 outline border-white border-2 cursor-pointer shrink-0"
                        style={{
                          backgroundColor: primaryColor,
                          outlineColor: primaryColor,
                        }}
                      />
                    </PopoverTrigger>
                    <PopoverContent>
                      <HexColorPicker
                        color={primaryColor}
                        onChange={(color) => {
                          setPrimaryColor(color);
                          form.setValue("brand_color", color);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div> */}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-subtle w-32">
                  Secondary color:
                </span>
                {/* <div className="flex gap-2">
                  <InputForm
                    formControl={form.control}
                    name="secondary_color"
                    onChange={(e) => {
                      form.setValue("secondary_color", e.target.value);
                      setSecondaryColor(e.target.value);
                    }}
                    className="w-32"
                  />

                  <Popover>
                    <PopoverTrigger asChild>
                      <div
                        className="w-10 h-10 rounded-full outline-1 outline border-white border-2 cursor-pointer shrink-0"
                        style={{
                          backgroundColor: secondaryColor,
                          outlineColor: secondaryColor,
                        }}
                      />
                    </PopoverTrigger>
                    <PopoverContent>
                      <HexColorPicker
                        color={secondaryColor}
                        onChange={(color) => {
                          setSecondaryColor(color);
                          form.setValue("secondary_color", color);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div> */}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Link href="/discovery-choose-plan">
            <Button>Next</Button>
          </Link>
        </div>
      </form>
    </Form>
  );
}
