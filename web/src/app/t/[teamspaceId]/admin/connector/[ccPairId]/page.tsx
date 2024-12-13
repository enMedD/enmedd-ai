"use client";

import { Main } from "@/app/admin/connector/[ccPairId]/Main";
import { BackButton } from "@/components/BackButton";
import { useRouter } from "next/navigation";

export default function Page({
  params,
}: {
  params: { ccPairId: string; teamsapceId: string };
}) {
  const ccPairId = parseInt(params.ccPairId);
  const router = useRouter();

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="container">
        <BackButton
          behaviorOverride={() =>
            router.push(`/t/${params.teamsapceId}/admin/indexing/status`)
          }
        />
        <Main ccPairId={ccPairId} teamspaceId={params.teamsapceId} />
      </div>
    </div>
  );
}
