"use client";

import { BackButton } from "@/components/BackButton";
import { Main } from "./Main";
import { useRouter } from "next/navigation";

export default function Page({ params }: { params: { ccPairId: string } }) {
  const ccPairId = parseInt(params.ccPairId);
  const router = useRouter();

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="container">
        <BackButton
          behaviorOverride={() => router.push("/admin/indexing/status")}
        />
        <Main ccPairId={ccPairId} />
      </div>
    </div>
  );
}
