"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { InputForm, SubLabel } from "@/components/admin/connectors/Field";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/app/admin/settings/ImageUpload";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { buildImgUrl } from "@/app/chat/files/images/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";

const formSchema = z.object({
  instance_name: z.string().nullable(),
  instance_description: z.string().nullable(),
  custom_logo: z.string().nullable(),
  brand_color: z.string(),
  secondary_color: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export default function InstanceBranding() {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#65007E");
  const [secondaryColor, setSecondaryColor] = useState("#EEB3FE");

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await fetch("/api/themes", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const themes = await response.json();

        setPrimaryColor(themes.brand["500"]);
        setSecondaryColor(themes.secondary["500"]);
      } catch (error) {
        console.error("Error fetching themes:", error);
      }
    };

    fetchThemes();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instance_name: "",
      instance_description: "",
      custom_logo: "",
      brand_color: "",
      secondary_color: "",
    },
  });

  const onSubmit = async (values: FormValues) => {};

  return (
    <div className="pb-20">
      <h2 className="font-bold text-lg md:text-xl">Instance Branding</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="py-8 ">
            <div className="flex gap-5 flex-col md:flex-row items-center">
              <div className="md:w-96 lg:w-60 xl:w-[500px] shrink-0">
                <Label
                  htmlFor="instance_name"
                  className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
                >
                  Instance Name
                </Label>
              </div>

              <div className="md:w-[600px]">
                <InputForm
                  formControl={form.control}
                  name="instance_name"
                  placeholder="Enter Instance Name"
                />
              </div>
            </div>
          </div>

          <div className="py-8 ">
            <div className="flex gap-5 flex-col md:flex-row">
              <div className="md:w-96 lg:w-60 xl:w-[500px] shrink-0">
                <Label
                  htmlFor="instance_name"
                  className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
                >
                  Instance Description
                </Label>
              </div>

              <div className="md:w-[600px]">
                <InputForm
                  formControl={form.control}
                  name="instance_description"
                  placeholder="Enter Instance Description"
                  isTextarea
                  className="min-h-40 max-h-80"
                />
              </div>
            </div>
          </div>

          <div className="py-8 ">
            <div className="flex gap-5 flex-col md:flex-row">
              <div className="leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
                <Label
                  htmlFor="custom_logo"
                  className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
                >
                  Company Logo
                </Label>
              </div>

              <div className="md:w-[600px] flex flex-col gap-4">
                <ImageUpload
                  selectedFile={selectedLogo}
                  setSelectedFile={setSelectedLogo}
                />
                {!selectedLogo && (
                  <div className="space-y-2">
                    <SubLabel>Current Logo:</SubLabel>
                    {selectedLogo ? (
                      <>
                        <img
                          src={"/api/workspace/logo?workspace_id=" + 0}
                          alt="Logo"
                          className="h-40 object-contain w-40"
                        />
                        <Button
                          variant="destructive"
                          type="button"
                          //   onClick={deleteLogo}
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
                )}
              </div>
            </div>
          </div>

          <div className="py-8">
            <div className="flex gap-5 flex-col md:flex-row">
              <div className="md:w-96 lg:w-60 xl:w-[500px] shrink-0">
                <Label
                  htmlFor="workspace_description"
                  className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
                >
                  Brand Theme
                </Label>
              </div>

              <div className="md:w-[600px] space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-subtle w-32">
                    Primary color:
                  </span>
                  <div className="flex gap-2">
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
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-subtle w-32">
                    Secondary color:
                  </span>
                  <div className="flex gap-2">
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
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
