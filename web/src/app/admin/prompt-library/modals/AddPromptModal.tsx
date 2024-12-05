import React from "react";
import { AddPromptModalProps } from "../interfaces";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      await onSubmit({
        prompt: values.title,
        content: values.content,
      });

      toast({
        title: "Prompt Created Successfully",
        description: "Prompt created successfully!",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Prompt Creation Failed",
        description: "Failed to create the prompt.",
        variant: "destructive",
      });
    }
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel htmlFor="title">Title</FormLabel>
              <FormControl>
                <Input placeholder="Title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel htmlFor="content">Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a content (e.g. 'help me rewrite the following politely and concisely for professional communication')"
                  className="min-h-40 max-h-96"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
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
