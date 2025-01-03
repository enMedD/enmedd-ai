import React, { useEffect } from "react";
import { useInputPrompt } from "../hooks";
import { EditPromptModalProps } from "../interfaces";
import { CustomModal } from "@/components/CustomModal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { CheckboxForm, InputForm } from "@/components/admin/connectors/Field";
import { PROMPT_SUCCESS_MESSAGES } from "@/constants/toast/success";
import { PROMPT_ERROR_MESSAGES } from "@/constants/toast/error";

const formSchema = z.object({
  prompt: z.string().min(1, {
    message: "Title is required",
  }),
  content: z.string().min(1, {
    message: "Content is required",
  }),
  active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const EditPromptModal = ({
  onClose,
  promptId,
  editInputPrompt,
}: EditPromptModalProps) => {
  const { toast } = useToast();
  const {
    data: promptData,
    error,
    refreshInputPrompt,
  } = useInputPrompt(promptId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      content: "",
      active: false,
    },
  });

  useEffect(() => {
    if (promptData) {
      form.setValue("prompt", promptData.prompt);
      form.setValue("content", promptData.content);
      form.setValue("active", promptData.active);
    }
  }, [promptData, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await editInputPrompt(promptId, values);

      toast({
        title: PROMPT_SUCCESS_MESSAGES.UPDATE_CREATE.title(true),
        description: PROMPT_SUCCESS_MESSAGES.UPDATE_CREATE.description(true),
        variant: "success",
      });
    } catch (error) {
      toast({
        title: PROMPT_ERROR_MESSAGES.UPDATE_CREATE.title(true),
        description: PROMPT_ERROR_MESSAGES.UPDATE_CREATE.description(true),
        variant: "destructive",
      });
    }
    refreshInputPrompt();
  };

  const renderModalContent = () => {
    if (error) {
      return <p>Failed to load prompt data</p>;
    }

    if (!promptData) {
      return <p>Loading...</p>;
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <InputForm
            formControl={form.control}
            name="prompt"
            label="Title"
            placeholder="Enter a title"
          />

          <InputForm
            formControl={form.control}
            name="content"
            label="Content"
            placeholder="Enter a content (e.g. 'help me rewrite the following politely and concisely for professional communication')"
            className="min-h-40 max-h-96"
            isTextarea
          />

          <CheckboxForm
            formControl={form.control}
            name="active"
            label="Active prompt"
          />

          <div className="mt-6 flex gap-2 justify-end">
            <Button
              disabled={form.formState.isSubmitting}
              onClick={onClose}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                form.formState.isSubmitting ||
                (form.getValues("prompt") === promptData.prompt &&
                  form.getValues("content") === promptData.content &&
                  form.getValues("active") === promptData.active)
              }
            >
              {form.formState.isSubmitting ? "Updating..." : "Update prompt"}
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  return (
    <CustomModal
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Pencil />
          Edit prompt
        </div>
      }
      trigger={null}
      open={!!promptId}
    >
      {renderModalContent()}
    </CustomModal>
  );
};

export default EditPromptModal;
