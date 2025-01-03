"use client";

import { WelcomeTopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ShieldEllipsis } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/Spinner";
import { HealthCheckBanner } from "@/components/health/healthcheck";
import { TWOFACTOR_SUCCESS_MESSAGES } from "@/constants/toast/success";
import { TWOFACTOR_ERROR_MESSAGES } from "@/constants/toast/error";

const Page = () => {
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const user_email = searchParams.get("email");

  if (!user_email) {
    router.push("/auth/login");
  }

  const handleContinue = async (value: string) => {
    try {
      const response = await fetch(`/api/auth/verify-otp?email=${user_email}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp_code: value }),
      });

      if (!response.ok) {
        throw new Error("Error verifying OTP");
      }

      toast({
        title: TWOFACTOR_SUCCESS_MESSAGES.AUTHENTICATION.title,
        description: TWOFACTOR_SUCCESS_MESSAGES.AUTHENTICATION.description,
        variant: "success",
      });

      router.push("/chat");
    } catch (error) {
      toast({
        title: TWOFACTOR_ERROR_MESSAGES.AUTHENTICATION.title,
        description: TWOFACTOR_ERROR_MESSAGES.AUTHENTICATION.description,
        variant: "destructive",
      });
      console.error("Error:", error);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    const response = await fetch(
      `/api/users/generate-otp?email=${user_email}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    if (!response.ok) {
      toast({
        title: TWOFACTOR_ERROR_MESSAGES.RESEND_OTP.title,
        description: TWOFACTOR_ERROR_MESSAGES.RESEND_OTP.description(
          response.statusText
        ),
        variant: "destructive",
      });
    } else {
      toast({
        title: TWOFACTOR_SUCCESS_MESSAGES.RESEND_OTP.title,
        description: TWOFACTOR_SUCCESS_MESSAGES.RESEND_OTP.description,
        variant: "success",
      });
    }
    setIsLoading(false);
  };

  const handleInputChange = (newValue: string) => {
    setValue(newValue);
    if (newValue.length === 6) {
      handleContinue(newValue);
    }
  };

  return (
    <main className="h-full">
      {isLoading && <Spinner />}
      <HealthCheckBanner />
      <WelcomeTopBar />

      <div className="w-full h-full mx-auto flex flex-col justify-between overflow-y-auto">
        <div className="w-full xl:w-1/2 h-full flex items-center justify-center mx-auto px-6 lg:px-14 3xl:px-0">
          <div className="w-full md:w-3/4 lg:w-1/2 xl:w-full 3xl:w-1/2 my-auto pb-14 md:pb-20">
            <div className="flex items-center justify-center">
              <div className="bg-brand-500 p-3 rounded-md">
                <ShieldEllipsis size={60} stroke="white" />
              </div>
            </div>

            <div className="pt-8">
              <h1 className="text-2xl xl:text-3xl font-bold text-center text-dark-900">
                Setup Two-Factor Authentication
              </h1>
              <p className="text-center pt-2 text-sm text-subtle">
                Please check your email a 6 digit code has been sent to your
                registered email{" "}
                <span className="font-semibold text-default">
                  “{user_email}”
                </span>
              </p>
            </div>

            <div className="pt-8 flex items-center flex-col gap-8 justify-center">
              <InputOTP
                maxLength={6}
                value={value}
                onChange={handleInputChange}
              >
                <InputOTPGroup>
                  <InputOTPSlot
                    index={0}
                    className="w-10 h-10 sm:w-14 sm:h-14 md:h-16 md:w-16 text-3xl font-bold"
                  />
                  <InputOTPSlot
                    index={1}
                    className="w-10 h-10 sm:w-14 sm:h-14 md:h-16 md:w-16 text-3xl font-bold"
                  />
                  <InputOTPSlot
                    index={2}
                    className="w-10 h-10 sm:w-14 sm:h-14 md:h-16 md:w-16 text-3xl font-bold"
                  />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot
                    index={3}
                    className="w-10 h-10 sm:w-14 sm:h-14 md:h-16 md:w-16 text-3xl font-bold"
                  />
                  <InputOTPSlot
                    index={4}
                    className="w-10 h-10 sm:w-14 sm:h-14 md:h-16 md:w-16 text-3xl font-bold"
                  />
                  <InputOTPSlot
                    index={5}
                    className="w-10 h-10 sm:w-14 sm:h-14 md:h-16 md:w-16 text-3xl font-bold"
                  />
                </InputOTPGroup>
              </InputOTP>

              <Button
                className="w-full max-w-[450px]"
                onClick={() => handleContinue}
              >
                Continue
              </Button>

              <p className="text-center text-sm">
                Didn&apos;t receive a code?{" "}
                <Link
                  href=""
                  onClick={handleResendOTP}
                  className="text-sm font-medium text-link hover:underline"
                >
                  Resend Code
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="w-full h-14 md:h-20"></div>
      </div>
    </main>
  );
};

export default Page;
