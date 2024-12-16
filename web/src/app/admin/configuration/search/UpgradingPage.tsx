import { Loading } from "@/components/Loading";
import { errorHandlingFetcher } from "@/lib/fetcher";
import {
  ConnectorIndexingStatus,
  FailedConnectorIndexingStatus,
  ValidStatuses,
} from "@/lib/types";
import { Text, Title } from "@tremor/react";
import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { ReindexingProgressTable } from "../../../../components/embedding/ReindexingProgressTable";
import { ErrorCallout } from "@/components/ErrorCallout";
import {
  CloudEmbeddingModel,
  HostedEmbeddingModel,
} from "../../../../components/embedding/interfaces";
import { Connector } from "@/lib/connectors/connectors";
import { FailedReIndexAttempts } from "@/components/embedding/FailedReIndexAttempts";
import { useToast } from "@/hooks/use-toast";
import { DeleteModal } from "@/components/DeleteModal";
import { Button } from "@/components/ui/button";

export default function UpgradingPage({
  futureEmbeddingModel,
}: {
  futureEmbeddingModel: CloudEmbeddingModel | HostedEmbeddingModel;
}) {
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const { toast } = useToast();
  const { data: connectors } = useSWR<Connector<any>[]>(
    "/api/manage/connector",
    errorHandlingFetcher,
    { refreshInterval: 5000 } // 5 seconds
  );

  const {
    data: ongoingReIndexingStatus,
    isLoading: isLoadingOngoingReIndexingStatus,
  } = useSWR<ConnectorIndexingStatus<any, any>[]>(
    "/api/manage/admin/connector/indexing-status?secondary_index=true",
    errorHandlingFetcher,
    { refreshInterval: 5000 } // 5 seconds
  );

  const { data: failedIndexingStatus } = useSWR<
    FailedConnectorIndexingStatus[]
  >(
    "/api/manage/admin/connector/failed-indexing-status?secondary_index=true",
    errorHandlingFetcher,
    { refreshInterval: 5000 } // 5 seconds
  );

  const onCancel = async () => {
    const response = await fetch("/api/search-settings/cancel-new-embedding", {
      method: "POST",
    });
    if (response.ok) {
      mutate("/api/search-settings/get-secondary-search-settings");
    } else {
      toast({
        title: "Cancellation Failed",
        description: `Failed to cancel embedding model update - ${await response.text()}`,
        variant: "destructive",
      });
    }
    setIsCancelling(false);
  };
  const statusOrder: Record<ValidStatuses, number> = {
    failed: 0,
    completed_with_errors: 1,
    not_started: 2,
    in_progress: 3,
    success: 4,
  };

  const sortedReindexingProgress = useMemo(() => {
    return [...(ongoingReIndexingStatus || [])].sort((a, b) => {
      const statusComparison =
        statusOrder[a.latest_index_attempt?.status || "not_started"] -
        statusOrder[b.latest_index_attempt?.status || "not_started"];

      if (statusComparison !== 0) {
        return statusComparison;
      }

      return (
        (a.latest_index_attempt?.id || 0) - (b.latest_index_attempt?.id || 0)
      );
    });
  }, [ongoingReIndexingStatus]);

  return (
    <>
      {isCancelling && (
        <DeleteModal
          title="Are you sure you want to cancel?"
          onClose={() => setIsCancelling(false)}
          open={isCancelling}
          description="Cancelling will revert to the previous model and all progress will
              be lost."
          onSuccess={onCancel}
        />
      )}

      {futureEmbeddingModel && (
        <div>
          <Title className="mt-8">Current Upgrade Status</Title>
          <div className="mt-4">
            <p className="italic mb-2">
              Currently in the process of switching to:{" "}
              {futureEmbeddingModel.model_name}
            </p>

            <Button
              className="mt-4"
              variant="destructive"
              onClick={() => setIsCancelling(true)}
            >
              Cancel
            </Button>

            {connectors && connectors.length > 0 ? (
              <>
                {failedIndexingStatus && failedIndexingStatus.length > 0 && (
                  <FailedReIndexAttempts
                    failedIndexingStatuses={failedIndexingStatus}
                  />
                )}

                <Text className="my-4">
                  The table below shows the re-indexing progress of all existing
                  connectors. Once all connectors have been re-indexed
                  successfully, the new model will be used for all search
                  queries. Until then, we will use the old model so that no
                  downtime is necessary during this transition.
                </Text>

                {isLoadingOngoingReIndexingStatus ? (
                  <Loading />
                ) : sortedReindexingProgress ? (
                  <ReindexingProgressTable
                    reindexingProgress={sortedReindexingProgress}
                  />
                ) : (
                  <ErrorCallout errorTitle="Failed to fetch re-indexing progress" />
                )}
              </>
            ) : (
              <div className="mt-8 p-6 bg-background-100 border border-border-strong rounded-lg max-w-2xl">
                <h3 className="text-lg font-semibold mb-2">
                  Switching Embedding Models
                </h3>
                <p className="mb-4 text-text-800">
                  You&apos;re currently switching embedding models, but there
                  are no connectors to re-index. This means the transition will
                  be quick and seamless.
                </p>
                <p className="text-text-600">
                  The new model will be active soon.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
