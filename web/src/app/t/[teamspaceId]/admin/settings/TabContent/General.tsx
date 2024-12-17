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
  const [loading, setLoading] = useState(false);
  const [teamspace, setTeamspace] = useState<Teamspace | undefined>();

  useEffect(() => {
    const fetchTeamspace = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/manage/admin/teamspace/${teamspaceId}`
        );
        if (response.ok) {
          const data: Teamspace = await response.json();
          setTeamspace(data);
        } else {
          console.error("Failed to fetch teamspace data");
        }
      } catch (error) {
        console.error("Error fetching teamspace:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamspace();
  }, [teamspaceId]);

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
          title: "Update Failed",
          description: error.detail || "Failed to update teamspace.",
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
            title: "Logo Upload Failed",
            description: error.detail,
            variant: "destructive",
          });
          return;
        }
      }

      router.refresh();
      toast({
        title: "Success",
        description: "Teamspace updated successfully.",
        variant: "success",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
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
          title: "Invalid file type",
          description: "Please upload a valid image file.",
          status: "error",
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
        setTeamspace({ ...teamspace, logo: undefined }); // Update teamspace state
        router.refresh(); // Refresh to reflect changes
        toast({
          title: "Success",
          description: "Logo removed successfully.",
          variant: "success",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Removal Failed",
          description: error.detail,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
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
            {isEditing ? (
              <InputForm
                formControl={form.control}
                name="teamspace_name"
                placeholder="Enter Teamspace Name"
              />
            ) : form.getValues("teamspace_name") ? (
              <h3 className="truncate">{form.getValues("teamspace_name")}</h3>
            ) : (
              <Skeleton className="w-full h-8 rounded-md" />
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
            ) : form.getValues("teamspace_description") ? (
              <h3 className="truncate">
                {form.getValues("teamspace_description")}
              </h3>
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
                {selectedFile ? (
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
                      background: useGradient(form.getValues("teamspace_name")),
                    }}
                    className="font-bold text-inverted bg-brand-500 text-2xl flex justify-center items-center uppercase w-full h-full"
                  >
                    {form.getValues("teamspace_name").charAt(0)}
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
                  onClick={() => setIsEditing(false)}
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
