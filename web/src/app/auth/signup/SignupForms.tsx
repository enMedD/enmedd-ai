"use client";

import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { basicLogin, basicSignup, validateInvite } from "@/lib/user";
import { generateOtp } from "@/lib/user";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { useFeatureFlag } from "@/components/feature_flag/FeatureFlagContext";
import { PasswordRequirements } from "./PasswordRequirements";
import { usePasswordValidation } from "@/hooks/usePasswordValidation";
import ReCAPTCHA from "react-google-recaptcha";
import { NEXT_PUBLIC_CAPTCHA_SITE_KEY } from "@/lib/constants";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { InputForm } from "@/components/admin/connectors/Field";
import {
  PASSWORD_ERROR_MESSAGES,
  RECAPTCHA_MISSING,
  SIGNUP_ERROR_MESSAGES,
} from "@/constants/toast/error";

export function SignupForms({ shouldVerify }: { shouldVerify?: boolean }) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("invitetoken") || "";
  const isTwoFactorAuthEnabled = useFeatureFlag("two_factor_auth");

  // Use the custom hook
  const {
    passwordStrength,
    passwordFocused,
    passwordFeedback,
    passwordWarning,
    hasUppercase,
    hasNumberOrSpecialChar,
    calculatePasswordStrength,
    setPasswordFocused,
  } = usePasswordValidation();

  const formSchema = z.object({
    full_name: z.string().min(2, {
      message: "Please fill out this field.",
    }),
    company_name: z.string().min(2, {
      message: "Please fill out this field.",
    }),
    email: z.string().min(2, {
      message: "Please fill out this field.",
    }),
    password: z.string().min(8, {
      message: "Please fill out this field.",
    }),
    confirm_password: z.string().min(8, {
      message: "Please fill out this field.",
    }),
  });

  // Initialize form using react-hook-form with Zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      company_name: "",
      email: email,
      password: "",
      confirm_password: "",
    },
  });

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    const captchaValue = recaptchaRef.current?.getValue();
    if (!captchaValue && NEXT_PUBLIC_CAPTCHA_SITE_KEY) {
      toast({
        title: RECAPTCHA_MISSING.title,
        description: RECAPTCHA_MISSING.description,
        variant: "destructive",
      });
      return;
    }

    if (
      !(values.password.length >= 8 && hasUppercase && hasNumberOrSpecialChar)
    ) {
      setPasswordFocused(true);
      toast({
        title: PASSWORD_ERROR_MESSAGES.REQUIREMENTS.title,
        description:
          PASSWORD_ERROR_MESSAGES.REQUIREMENTS.description(passwordWarning),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const response = await basicSignup(
      values.full_name,
      values.company_name,
      values.email,
      values.password,
      token
    );

    if (!response.ok) {
      setIsLoading(false);
      const errorDetail = (await response.json()).detail;

      let errorMsg = "Unknown error";
      if (errorDetail) errorMsg = errorDetail;
      if (errorDetail === "REGISTER_USER_ALREADY_EXISTS") {
        errorMsg = "An account already exist with the specified email.";
      }

      toast({
        title: SIGNUP_ERROR_MESSAGES.SIGNUP_FAILED.title,
        description: SIGNUP_ERROR_MESSAGES.SIGNUP_FAILED.description(errorMsg),
        variant: "destructive",
      });

      setPasswordFocused(true);
      return;
    }

    // logs in data after signing up
    const loginResponse = await basicLogin(values.email, values.password);
    if (loginResponse.ok) {
      if (token) {
        const validateToken = await validateInvite(values.email, token);
        if (!validateToken.ok) {
          toast({
            title: SIGNUP_ERROR_MESSAGES.INVALID_INVITE_TOKEN.title,
            description: SIGNUP_ERROR_MESSAGES.INVALID_INVITE_TOKEN.description,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }
      // TODO: the shouldVerify is not returning the correct value
      if (isTwoFactorAuthEnabled && !shouldVerify) {
        const otpResponse = await generateOtp(values.email);
        if (otpResponse.ok) {
          router.push(`/auth/2factorverification/?email=${values.email}`);
        } else {
          toast({
            title: SIGNUP_ERROR_MESSAGES.OTP_GENERATION_FAILED.title,
            description:
              SIGNUP_ERROR_MESSAGES.OTP_GENERATION_FAILED.description,
            variant: "destructive",
          });
        }
      } else {
        router.push("/");
      }
    }
    setIsLoading(false);
  }

  return (
    <>
      {isLoading && <Spinner />}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name Field */}
          <InputForm
            formControl={form.control}
            name="full_name"
            label="Full Name"
            placeholder="Enter your full name"
          />

          {/* Company Name Field */}
          <InputForm
            formControl={form.control}
            name="company_name"
            label="Company Name"
            placeholder="Enter your company name"
          />

          {/* Email Field */}
          <InputForm
            formControl={form.control}
            name="email"
            label="Email"
            placeholder="Enter your email"
          />

          {/* Password Field */}
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
                      placeholder="Enter your password"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e); // Update form state
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

          {/* Confirm Password Field */}
          <InputForm
            formControl={form.control}
            name="confirm_password"
            label="Confirm Password"
            placeholder="Confirm your password"
            type="password"
          />

          {NEXT_PUBLIC_CAPTCHA_SITE_KEY && (
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={NEXT_PUBLIC_CAPTCHA_SITE_KEY}
              className="pb-4"
            />
          )}

          <div className="flex pt-6">
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              Sign Up
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
