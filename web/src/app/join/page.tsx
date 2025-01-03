"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HealthCheckBanner } from "@/components/health/healthcheck";
import { WelcomeTopBar } from "@/components/TopBar";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Validating Invite Link...");
  const invitetoken = searchParams.get("invitetoken");

  useEffect(() => {
    if (invitetoken) {
      const validateInviteLink = async () => {
        try {
          const response = await fetch(
            `/api/users/validate-invite-link?token=${invitetoken}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            setStatus("Invite Link Validated Successfully!");
            setTimeout(() => {
              router.push("/");
            }, 2000);
          } else if (response.status === 403) {
            setTimeout(() => {
              router.push("/auth/signup");
            }, 2000);
          } else if (response.status === 422) {
            const error = await response.json();
            setStatus(
              `Validation Error: ${error.detail[0]?.msg || "Unknown error"}`
            );
          } else {
            setStatus("Failed to Validate Invite Link");
          }
        } catch (error) {
          setStatus("Network Error: Unable to validate invite link");
        }
      };

      validateInviteLink();
    }
  }, [invitetoken]);

  return (
    <main className="h-full overflow-y-auto">
      <HealthCheckBanner />

      <div className="w-full h-full mx-auto flex flex-col items-center">
        <WelcomeTopBar />

        <div className="w-full h-[85%] flex justify-center items-center">
          <p>{status}</p>
        </div>
      </div>
    </main>
  );
}
