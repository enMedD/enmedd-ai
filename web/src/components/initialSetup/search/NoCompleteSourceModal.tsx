"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CCPairBasicInfo, UserRole } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export function NoCompleteSourcesModal({
  ccPairs,
  userRole,
}: {
  ccPairs: CCPairBasicInfo[];
  userRole: UserRole | undefined;
}) {
  const { teamspaceId } = useParams();
  const router = useRouter();
  const [isHidden, setIsHidden] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (isHidden) {
    return null;
  }

  const totalDocs = ccPairs.reduce(
    (acc, ccPair) => acc + ccPair.docs_indexed,
    0
  );

  return (
    <>
      <div
        className={`fixed z-notification top-5 right-0 md:right-5 mx-5 md:mx-0 md:w-96 transition-transform duration-200 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
        onTransitionEnd={() => {
          if (!isVisible) setIsHidden(true);
        }}
      >
        <Alert>
          <AlertTitle className="font-semibold pb-2 leading-normal">
            ⏳ None of your data sources have finished a full sync yet
          </AlertTitle>
          <AlertDescription>
            {userRole === "basic" ? (
              <p>
                Some data sources aren't finished syncing yet. Please contact a
                workspace admin for further assistance.
              </p>
            ) : (
              <div>
                You&apos;ve connected some data sources, but none of them have
                finished syncing.
                <br />
                <br />
                To view the status of your syncing data sources, head over to
                the{" "}
                <Link
                  className="text-link"
                  href={
                    teamspaceId
                      ? `/t/${teamspaceId}/admin/indexing/status`
                      : "/admin/indexing/status"
                  }
                >
                  Existing Data Sources page
                </Link>
                .
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    </>
  );
}
