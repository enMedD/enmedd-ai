"use client";

import { DeleteButton } from "@/components/DeleteButton";
import { deleteTokenRateLimit, updateTokenRateLimit } from "./lib";
import { Loading } from "@/components/Loading";
import { TokenRateLimitDisplay } from "./types";
import { errorHandlingFetcher } from "@/lib/fetcher";
import useSWR, { mutate } from "swr";
import { CustomCheckbox } from "@/components/CustomCheckbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteModal } from "@/components/DeleteModal";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type TokenRateLimitTableArgs = {
  tokenRateLimits: TokenRateLimitDisplay[];
  title?: string;
  description?: string;
  fetchUrl: string;
  hideHeading?: boolean;
  isAdmin: boolean;
};

export const TokenRateLimitTable = ({
  tokenRateLimits,
  title,
  description,
  fetchUrl,
  hideHeading,
  isAdmin,
}: TokenRateLimitTableArgs) => {
  const { toast } = useToast();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tokenRateToDelete, setTokenRateToDelete] =
    useState<TokenRateLimitDisplay | null>(null);
  const shouldRenderGroupName = () =>
    tokenRateLimits.length > 0 && tokenRateLimits[0].group_name !== undefined;

  const handleEnabledChange = (id: number) => {
    const tokenRateLimit = tokenRateLimits.find(
      (tokenRateLimit) => tokenRateLimit.token_id === id
    );

    if (!tokenRateLimit) {
      return;
    }

    updateTokenRateLimit(id, {
      token_budget: tokenRateLimit.token_budget,
      period_hours: tokenRateLimit.period_hours,
      enabled: !tokenRateLimit.enabled,
    }).then(() => {
      mutate(fetchUrl);
    });
  };

  if (tokenRateLimits.length === 0) {
    return (
      <div>
        {!hideHeading && title && <h3>{title}</h3>}
        {!hideHeading && description && (
          <p className="mt-2 mb-4 text-sm">{description}</p>
        )}
        <p className={`text-sm ${!hideHeading && "my-8"}`}>
          No token rate limits set!
        </p>
      </div>
    );
  }

  return (
    <div>
      {isDeleteModalOpen && tokenRateToDelete && (
        <DeleteModal
          title="Are you sure you want to remove this token rate?"
          description={`This action will remove the selected token rate on ${tokenRateToDelete.group_name}.`}
          onClose={() => setIsDeleteModalOpen(false)}
          open={isDeleteModalOpen}
          onSuccess={async () => {
            const response = await deleteTokenRateLimit(
              tokenRateToDelete.token_id
            );

            if (response.ok) {
              toast({
                title: "Deletion Success",
                description: `Token rate "${tokenRateToDelete.group_name}" deletion success.`,
                variant: "success",
              });

              mutate(fetchUrl);

              setIsDeleteModalOpen(false);
            } else {
              const errorMsg = (await response.json()).detail;
              toast({
                title: "Deletion Failed",
                description: `Failed to delete token rate - ${errorMsg}`,
                variant: "destructive",
              });
            }
          }}
        />
      )}

      {!hideHeading && title && <h3>{title}</h3>}
      {!hideHeading && description && (
        <p className="mt-2 mb-4 text-sm">{description}</p>
      )}
      <Card>
        <CardContent className="p-0">
          <Table className="overflow-visibl">
            <TableHeader>
              <TableRow>
                <TableHead>Enabled</TableHead>
                {shouldRenderGroupName() && <TableHead>Group Name</TableHead>}
                <TableHead>Time Window (Hours)</TableHead>
                <TableHead>Token Budget (Thousands)</TableHead>
                {isAdmin && <TableHead>Delete</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokenRateLimits.map((tokenRateLimit) => {
                return (
                  <TableRow key={tokenRateLimit.token_id}>
                    <TableCell>
                      <div
                        onClick={
                          isAdmin
                            ? () => handleEnabledChange(tokenRateLimit.token_id)
                            : undefined
                        }
                        className="cursor-pointer"
                      >
                        <div className="flex items-center">
                          <CustomCheckbox
                            checked={tokenRateLimit.enabled}
                            onChange={
                              isAdmin
                                ? () =>
                                    handleEnabledChange(tokenRateLimit.token_id)
                                : undefined
                            }
                          />
                          <p className="ml-2">
                            {tokenRateLimit.enabled ? "Enabled" : "Disabled"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    {shouldRenderGroupName() && (
                      <TableCell className="font-bold text-emphasis">
                        {tokenRateLimit.group_name}
                      </TableCell>
                    )}
                    <TableCell>
                      {tokenRateLimit.period_hours +
                        " hour" +
                        (tokenRateLimit.period_hours > 1 ? "s" : "")}
                    </TableCell>
                    <TableCell>
                      {tokenRateLimit.token_budget + " thousand tokens"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {/* <DeleteButton
                          onClick={() => handleDelete(tokenRateLimit.token_id)}
                        /> */}
                        <DeleteButton
                          onClick={() => {
                            setTokenRateToDelete(tokenRateLimit);
                            setIsDeleteModalOpen(true);
                          }}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export const GenericTokenRateLimitTable = ({
  fetchUrl,
  title,
  description,
  hideHeading,
  responseMapper,
  isAdmin = true,
}: {
  fetchUrl: string;
  title?: string;
  description?: string;
  hideHeading?: boolean;
  responseMapper?: (data: any) => TokenRateLimitDisplay[];
  isAdmin?: boolean;
}) => {
  const { data, isLoading, error } = useSWR(fetchUrl, errorHandlingFetcher);

  if (isLoading) {
    return <Loading />;
  }

  if (!isLoading && error) {
    return <p>Failed to load token rate limits</p>;
  }

  let processedData = data;
  if (responseMapper) {
    processedData = responseMapper(data);
  }

  return (
    <TokenRateLimitTable
      tokenRateLimits={processedData}
      fetchUrl={fetchUrl}
      title={title}
      description={description}
      hideHeading={hideHeading}
      isAdmin={isAdmin}
    />
  );
};
