"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, RectangleEllipsis } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { usePasswordValidation } from "@/hooks/usePasswordValidation";
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
import { PasswordRequirements } from "../signup/PasswordRequirements";
import { InputForm } from "@/components/admin/connectors/Field";
import {
  GLOBAL_ERROR_MESSAGES,
  PASSWORD_ERROR_MESSAGES,
} from "@/constants/error";
import { PASSWORD_SUCCESS_MESSAGES } from "@/constants/success";

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords must match",
    path: ["confirm_password"],
  });

type FormValues = z.infer<typeof formSchema>;

export const SetNewPasswordForms = () => {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("token");

  const {
    passwordFocused,
    passwordStrength,
    hasUppercase,
    hasNumberOrSpecialChar,
    calculatePasswordStrength,
    passwordFeedback,
    passwordWarning,
    setPasswordFocused,
  } = usePasswordValidation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    if (!resetToken) {
      router.push("/");
    }
  }, [resetToken, router]);

  const handleSubmit = async (values: FormValues) => {
    if (!(hasUppercase && hasNumberOrSpecialChar)) {
      toast({
        title: PASSWORD_ERROR_MESSAGES.REQUIREMENTS.title,
        description:
          PASSWORD_ERROR_MESSAGES.REQUIREMENTS.description(passwordWarning),
        variant: "destructive",
      });
      return;
    }

    const response = await fetch("/api/auth/reset-password", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        token: resetToken,
        password: values.password,
      }),
    });

    if (response.status === 200) {
      toast({
        title: PASSWORD_SUCCESS_MESSAGES.CHANGE.title,
        description: PASSWORD_SUCCESS_MESSAGES.CHANGE.description,
        variant: "success",
      });
      router.push("/auth/reset-password/success");
    } else {
      toast({
        title: GLOBAL_ERROR_MESSAGES.UNEXPECTED.title,
        description: GLOBAL_ERROR_MESSAGES.UNEXPECTED.description(
          response.statusText
        ),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-center">
        <div className="bg-brand-500 p-5 rounded-md">
          <RectangleEllipsis size={40} stroke="white" />
        </div>
      </div>

      <h1 className="pt-8 text-2xl xl:text-3xl font-bold text-center text-dark-900">
        Set new password
      </h1>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4 pt-8"
        >
          <div className="relative">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your new password"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        calculatePasswordStrength(e.target.value);
                      }}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {passwordFocused && (
              <PasswordRequirements
                password={form.watch("password")}
                hasUppercase={hasUppercase}
                hasNumberOrSpecialChar={hasNumberOrSpecialChar}
                passwordStrength={passwordStrength}
                passwordFeedback={passwordFeedback}
                passwordWarning={passwordWarning}
              />
            )}
          </div>

          <InputForm
            formControl={form.control}
            name="confirm_password"
            label="Confirm Password"
            placeholder="Confirm your password"
            type="password"
          />

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
          className="text-sm font-medium text-link hover:underline mx-auto flex items-center gap-2"
        >
          <ChevronLeft size={16} /> Back to Login
        </Link>
      </div>
    </div>
  );
};
