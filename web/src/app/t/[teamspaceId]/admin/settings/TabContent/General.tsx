import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useGradient } from "@/hooks/useGradient";
import { Teamspace } from "@/lib/types";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { InputForm } from "@/components/admin/connectors/Field";
import { buildImgUrl } from "@/app/chat/files/images/utils";
import { useTeamspace } from "@/lib/hooks";
import { ErrorCallout } from "@/components/ErrorCallout";
import {
  GLOBAL_ERROR_MESSAGES,
  OPERATION_ERROR_MESSAGES,
  SETTINGS_LOGO_ERROR_MESSAGES,
} from "@/constants/error";
import {
  LOGO_SUCCESS_MESSAGES,
  TEAMSPACE_SUCCESS_MESSAGES,
} from "@/constants/success";

interface GeneralProps {
  teamspaceId: string | string[];
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
}

const formSchema = z.object({
  teamspace_name: z.string().min(1, {
    message: "This field is required",
  }),
  teamspace_description: z.string().min(1, {
    message: "This field is required",
  }),
  logo: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function General({
  teamspaceId,
  isEditing,
  setIsEditing,
}: GeneralProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [teamspaceLogo, setTeamspaceLogo] = useState<string | null>(null);
  const {
    isLoading: loading,
    error,
    data: teamspace,
    refreshTeamspace,
  } = useTeamspace(teamspaceId);

  if (error) {
    return (
      <ErrorCallout
        errorTitle={`Failed to fetch teamspace`}
        errorMsg={error || "Unknown error"}
      />
    );
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamspace_name: teamspace?.name ?? "",
      teamspace_description: teamspace?.description ?? "",
      logo: teamspace?.logo || null,
    },
  });

  const handleUpdate = async (values: FormValues) => {
    try {
      // Update teamspace name and description
      const updateResponse = await fetch(
        `/api/manage/admin/teamspace?teamspace_id=${teamspaceId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.teamspace_name,
            description: values.teamspace_description,
          }),
        }
      );

      if (!updateResponse.ok) {
        const error = await updateResponse.json();

        toast({
          title: OPERATION_ERROR_MESSAGES.ACTION.title("Update"),
          description: OPERATION_ERROR_MESSAGES.ACTION.description(
            "teamspace",
            "update",
            error.detail
          ),
          variant: "destructive",
        });
        return;
      }

      // Upload logo if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch(
          `/api/manage/admin/teamspace/logo?teamspace_id=${teamspaceId}`,
          { method: "PUT", body: formData }
        );

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          toast({
            title: OPERATION_ERROR_MESSAGES.ACTION.title("Logo Upload"),
            description: OPERATION_ERROR_MESSAGES.ACTION.description(
              "logo",
              "upload",
              error.detail
            ),
            variant: "destructive",
          });
          return;
        }
      }
      toast({
        title: TEAMSPACE_SUCCESS_MESSAGES.UPDATE.title,
        description: TEAMSPACE_SUCCESS_MESSAGES.UPDATE.description,
        variant: "success",
      });
      refreshTeamspace();
      router.refresh();
      setIsEditing(false);
    } catch (error) {
      console.log(error);
      toast({
        title: GLOBAL_ERROR_MESSAGES.UNKNOWN.title,
        description: GLOBAL_ERROR_MESSAGES.UNKNOWN.description,
        variant: "destructive",
      });
    }
  };

  const handleLogoUpload = () => {
    setIsEditing(true);
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && file.type.startsWith("image/")) {
        setSelectedFile(file);
      } else {
        toast({
          title: SETTINGS_LOGO_ERROR_MESSAGES.INVALID_TYPE.title,
          description: SETTINGS_LOGO_ERROR_MESSAGES.INVALID_TYPE.description,
          variant: "destructive",
        });
      }
    };
    fileInput.click();
  };

  const handleRemoveLogo = async () => {
    if (!teamspace) return; // Ensure teamspace is defined

    try {
      const response = await fetch(
        `/api/manage/admin/teamspace/${teamspaceId}/logo`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        form.setValue("logo", null); // Update form state
        setSelectedFile(null); // Reset selected file
        refreshTeamspace();
        router.refresh(); // Refresh to reflect changes
        toast({
          title: LOGO_SUCCESS_MESSAGES.TEAMSPACE_LOGO.title,
          description: LOGO_SUCCESS_MESSAGES.TEAMSPACE_LOGO.description,
          variant: "success",
        });
      } else {
        const error = await response.json();
        toast({
          title: OPERATION_ERROR_MESSAGES.ACTION.title("Logo Removal"),
          description: OPERATION_ERROR_MESSAGES.ACTION.description(
            "logo",
            "remove",
            error.detail
          ),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log(error);
      toast({
        title: GLOBAL_ERROR_MESSAGES.UNKNOWN.title,
        description: GLOBAL_ERROR_MESSAGES.UNKNOWN.description,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (teamspace) {
      form.setValue("teamspace_name", teamspace.name);
      form.setValue("teamspace_description", teamspace.description);
      form.setValue("logo", teamspace.logo);
    }
  }, [teamspace, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
        <div className="mt-8 w-full">
          <div>
            <h2 className="font-bold text-lg md:text-xl">
              General Information
            </h2>
            <p className="text-sm">Update your teamspace name and logo.</p>
          </div>

          <Section title="Teamspace Name" isEditing>
            {loading ? (
              <Skeleton className="w-full h-8 rounded-md" />
            ) : isEditing ? (
              <InputForm
                formControl={form.control}
                name="teamspace_name"
                placeholder="Enter teamspace name"
              />
            ) : teamspace?.name ? (
              <h3 className="truncate">{teamspace?.name}</h3>
            ) : (
              <p className="mt-2 text-gray-500">No name available</p>
            )}
          </Section>

          <Section title="Teamspace Description" isEditing>
            {loading ? (
              <Skeleton className="w-full h-8 rounded-md" />
            ) : isEditing ? (
              <InputForm
                formControl={form.control}
                name="teamspace_description"
                placeholder="Enter Teamspace Description"
              />
            ) : teamspace?.description ? (
              <h3 className="truncate">{teamspace?.description}</h3>
            ) : (
              <p className="mt-2 text-gray-500">No description available</p>
            )}
          </Section>

          <Section
            title="Teamspace Logo"
            description="Update your company logo and choose where to display it."
          >
            <div className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={handleLogoUpload}
                className="h-16 w-16 rounded-full overflow-hidden"
              >
                {loading ? (
                  <Skeleton className="w-full h-full rounded-full" />
                ) : selectedFile ? (
                  <img
                    src={selectedFile ? URL.createObjectURL(selectedFile) : ""}
                    alt="selected_teamspace_logo"
                    className="w-full h-full object-cover object-center"
                  />
                ) : teamspace?.logo ? (
                  <img
                    src={buildImgUrl(teamspace.logo)}
                    alt="current_teamspace_logo"
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div
                    style={{
                      background: useGradient(teamspace?.name || ""),
                    }}
                    className="font-bold text-inverted bg-brand-500 text-2xl flex justify-center items-center uppercase w-full h-full"
                  >
                    {teamspace?.name.charAt(0)}
                  </div>
                )}
              </div>

              {isEditing && teamspace?.logo && (
                <Button
                  variant="link"
                  className="text-destructive"
                  onClick={handleRemoveLogo}
                >
                  Remove
                </Button>
              )}
            </div>
          </Section>

          <div className="flex justify-end gap-2 py-8">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedFile(null);
                  }}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}

const Section = ({
  title,
  description,
  children,
  isEditing,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  isEditing?: boolean;
}) => (
  <div className="flex py-8 border-b gap-5">
    <div className="w-44 sm:w-80 xl:w-[500px] shrink-0">
      <h3>{title}</h3>
      {description && <p className="pt-1 text-sm">{description}</p>}
    </div>
    <div className={`flex-grow min-h-10 ${isEditing ? "" : "truncate"}`}>
      {children}
    </div>
  </div>
);
