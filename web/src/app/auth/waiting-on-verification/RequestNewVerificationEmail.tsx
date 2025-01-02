"use client";

import { requestEmailVerification } from "../lib";
import { Spinner } from "@/components/Spinner";
import { NEW_VERIFICATION_EMAIL_ERROR_MESSAGES } from "@/constants/toast/error";
import { NEW_VERIFICATION_EMAIL_SUCCESS_MESSAGES } from "@/constants/toast/success";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function RequestNewVerificationEmail({
  children,
  email,
}: {
  children: JSX.Element | string;
  email: string;
}) {
  const [isRequestingVerification, setIsRequestingVerification] =
    useState(false);
  const { toast } = useToast();

  return (
    <button
      className="text-link"
      onClick={async () => {
        setIsRequestingVerification(true);
        const response = await requestEmailVerification(email);
        setIsRequestingVerification(false);

        if (response.ok) {
          toast({
            title: NEW_VERIFICATION_EMAIL_SUCCESS_MESSAGES.SENT.title,
            description:
              NEW_VERIFICATION_EMAIL_SUCCESS_MESSAGES.SENT.description,
            variant: "success",
          });
        } else {
          const errorDetail = (await response.json()).detail;

          toast({
            title: NEW_VERIFICATION_EMAIL_ERROR_MESSAGES.SENT.title,
            description:
              NEW_VERIFICATION_EMAIL_ERROR_MESSAGES.SENT.description(
                errorDetail
              ),
            variant: "destructive",
          });
        }
      }}
    >
      {isRequestingVerification && <Spinner />}
      {children}
    </button>
  );
}
