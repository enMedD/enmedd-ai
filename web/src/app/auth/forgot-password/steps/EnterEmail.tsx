"use client";

import React, { useState } from "react";
import { Spinner } from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Fingerprint } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { InputForm } from "@/components/admin/connectors/Field";
import { GLOBAL_ERROR_MESSAGES } from "@/constants/error";

const formSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .min(1, {
      message: "Email is required",
    }),
});

type FormValues = z.infer<typeof formSchema>;

export const EnterEmail = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    const payload = { email: values.email };

    try {
      const response = await fetch("/api/auth/forgot-password", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.status === 202) {
        router.push("/auth/forgot-password/success");
      } else {
        toast({
          title: GLOBAL_ERROR_MESSAGES.UNEXPECTED.title,
          description: GLOBAL_ERROR_MESSAGES.UNEXPECTED.description(
            response.statusText
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {isLoading && <Spinner />}
      <div className="flex items-center justify-center">
        <div className="bg-brand-500 p-3 rounded-md">
          <Fingerprint size={60} stroke="white" />
        </div>
      </div>

      <div className="pt-8">
        <h1 className="text-2xl xl:text-3xl font-bold text-center text-dark-900">
          Forgot Password?
        </h1>
        <p className="pt-2 text-center text-sm text-subtle">
          Enter your email to reset your password
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4 pt-8"
        >
          <div>
            <InputForm
              formControl={form.control}
              name="email"
              type="email"
              label="Email"
              placeholder="Enter your email"
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-6"
            disabled={form.formState.isSubmitting}
          >
            Continue
          </Button>
        </form>
      </Form>

      <div className="flex pt-6">
        <Link
          href="/auth/login"
          className="text-sm font-medium text-link hover:underline mx-auto"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};
