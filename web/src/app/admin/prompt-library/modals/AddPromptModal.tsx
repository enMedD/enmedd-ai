import React, { useEffect } from "react";
import { AddPromptModalProps } from "../interfaces";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { InputForm } from "@/components/admin/connectors/Field";
import { PROMPT_SUCCESS_MESSAGES } from "@/constants/success";
import { PROMPT_ERROR_MESSAGES } from "@/constants/error";

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Please enter a title for the prompt",
  }),
  content: z.string().min(1, {
    message: "Please enter a content for the prompt",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const AddPromptModal = ({ onClose, onSubmit }: AddPromptModalProps) => {
  const { toast } = useToast();

  const cachedFormData = JSON.parse(
    localStorage.getItem("promptFormData") || "{}"
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: cachedFormData.title || "",
      content: cachedFormData.content || "",
    },
  });

  useEffect(() => {
    const subscription = form.watch((values) => {
      localStorage.setItem("promptFormData", JSON.stringify(values));
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = async (values: FormValues) => {
    try {
      await onSubmit({
        prompt: values.title,
        content: values.content,
      });

      toast({
        title: PROMPT_SUCCESS_MESSAGES.UPDATE_CREATE.title(),
        description: PROMPT_SUCCESS_MESSAGES.UPDATE_CREATE.description(),
        variant: "success",
      });

      onClose();
      localStorage.removeItem("promptFormData");
    } catch (error) {
      toast({
        title: PROMPT_ERROR_MESSAGES.CREATE_FAILED.title,
        description: PROMPT_ERROR_MESSAGES.CREATE_FAILED.description,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <InputForm
          formControl={form.control}
          name="title"
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

        <div className="w-full pt-4 flex justify-end gap-2">
          <Button
            type="button"
            disabled={form.formState.isSubmitting}
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Add prompt
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddPromptModal;
