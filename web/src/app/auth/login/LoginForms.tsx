"use client";

import { basicLogin } from "@/lib/user";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Spinner } from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import GmailIcon from "../../../../public/Gmail.png";
import MicrosoftIcon from "../../../../public/microsoft.svg";
import Image from "next/image";
import Link from "next/link";
import ReCAPTCHA from "react-google-recaptcha";
import { NEXT_PUBLIC_CAPTCHA_SITE_KEY } from "@/lib/constants";
import { useFeatureFlag } from "@/components/feature_flag/FeatureFlagContext";
import { Form } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputForm } from "@/components/admin/connectors/Field";

export function LogInForms({}: {}) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isTwoFactorAuthEnabled = useFeatureFlag("two_factor_auth");

  const formSchema = z.object({
    email: z.string().min(2, {
      message: "Please fill out this field.",
    }),
    password: z.string().min(8, {
      message: "Please fill out this field.",
    }),
  });

  // Initialize form using react-hook-form with Zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    const captchaValue = recaptchaRef.current?.getValue();
    if (!captchaValue && NEXT_PUBLIC_CAPTCHA_SITE_KEY) {
      toast({
        title: "ReCAPTCHA Missing",
        description: "Please complete the ReCAPTCHA to proceed.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const loginResponse = await basicLogin(values.email, values.password);
    if (loginResponse.ok) {
      if (isTwoFactorAuthEnabled) {
        router.push(`/auth/2factorverification/?email=${values.email}`);
        await fetch("/api/users/generate-otp", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
      } else {
        router.push("/");
      }
    } else {
      setIsLoading(false);
      const errorDetail = (await loginResponse.json()).detail;

      let errorMsg = "Unknown error";
      if (errorDetail === "LOGIN_BAD_CREDENTIALS") {
        errorMsg = "Invalid email or password";
      }
      toast({
        title: "Login Failed",
        description: `Failed to login - ${errorMsg}`,
        variant: "destructive",
      });
    }

    setIsLoading(false);
  }
  return (
    <>
      {isLoading && <Spinner />}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <InputForm
            formControl={form.control}
            name="email"
            label="Email"
            placeholder="Enter your email"
          />

          {/* Password Field */}
          <InputForm
            formControl={form.control}
            name="password"
            label="Password"
            placeholder="Enter your password"
            type="password"
          />

          <div className="flex justify-between w-full flex-row-reverse items-start">
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-link hover:underline"
            >
              Forgot password?
            </Link>

            {NEXT_PUBLIC_CAPTCHA_SITE_KEY && (
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={NEXT_PUBLIC_CAPTCHA_SITE_KEY}
                className="pb-4"
              />
            )}
          </div>

          <div className="flex pt-6">
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              Sign In
            </Button>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Separator className="flex-1" />
            <p className="text-sm whitespace-nowrap">Or login with</p>
            <Separator className="flex-1" />
          </div>

          <div className="flex flex-col items-center w-full gap-3 pt-4 md:gap-6 md:flex-row">
            <Button disabled className="flex-1 w-full" variant="outline">
              <Image src={GmailIcon} alt="gmail-icon" width={16} height={16} />{" "}
              Continue with Gmail
            </Button>
            <Button
              disabled
              className="flex-1 w-full"
              variant="outline"
              type="button"
            >
              <Image
                src={MicrosoftIcon}
                alt="microsoft-icon"
                width={16}
                height={16}
              />
              Continue with Microsoft
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
