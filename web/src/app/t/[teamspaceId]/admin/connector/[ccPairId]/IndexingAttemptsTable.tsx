import { useState } from "react";
import { IndexAttemptStatus } from "@/components/Status";
import { CCPairFullInfo } from "./types";
import { PageSelector } from "@/components/PageSelector";
import { localizeAndPrettify } from "@/lib/time";
import { getDocsProcessedPerMinute } from "@/lib/indexAttempt";
import { CheckmarkIcon, CopyIcon } from "@/components/icons/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CustomModal } from "@/components/CustomModal";
import { Card, CardContent } from "@/components/ui/card";

const NUM_IN_PAGE = 8;

export function IndexingAttemptsTable({ ccPair }: { ccPair: CCPairFullInfo }) {
  const [page, setPage] = useState(1);
  const [indexAttemptTracePopupId, setIndexAttemptTracePopupId] = useState<
    number | null
  >(null);
  const [isCopyClicked, setIsCopyClicked] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const indexAttemptToDisplayTraceFor = ccPair.index_attempts.find(
    (indexAttempt) => indexAttempt.id === indexAttemptTracePopupId
  );

  const handleClose = () => {
    setIndexAttemptTracePopupId(null);
    setIsModalVisible(false);
  };

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time Started</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>New Doc Cnt</TableHead>
                <TableHead>Total Doc Cnt</TableHead>
                <TableHead>Error Msg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ccPair.index_attempts
                .slice(NUM_IN_PAGE * (page - 1), NUM_IN_PAGE * page)
                .map((indexAttempt) => {
                  const docsPerMinute =
                    getDocsProcessedPerMinute(indexAttempt)?.toFixed(2);
                  return (
                    <TableRow key={indexAttempt.id}>
                      <TableCell>
                        {indexAttempt.time_started
                          ? localizeAndPrettify(indexAttempt.time_started)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <IndexAttemptStatus
                          status={indexAttempt.status || "not_started"}
                          size="xs"
                        />
                        {docsPerMinute && (
                          <div className="text-xs mt-1">
                            {docsPerMinute} docs / min
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex">
                          <div className="text-right">
                            <div>{indexAttempt.new_docs_indexed}</div>
                            {indexAttempt.docs_removed_from_index > 0 && (
                              <div className="text-xs w-52 text-wrap flex italic overflow-hidden whitespace-normal px-1">
                                (also removed{" "}
                                {indexAttempt.docs_removed_from_index} docs that
                                were detected as deleted in the source)
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{indexAttempt.total_docs_indexed}</TableCell>
                      <TableCell>
                        <div>
                          <p className="flex flex-wrap whitespace-normal break-all">
                            {indexAttempt.error_msg || "-"}
                          </p>
                          {indexAttempt.full_exception_trace && (
                            <CustomModal
                              trigger={
                                <div
                                  onClick={() => {
                                    setIndexAttemptTracePopupId(
                                      indexAttempt.id
                                    );
                                    setIsModalVisible(true);
                                  }}
                                  className="mt-2 text-link cursor-pointer select-none"
                                >
                                  View Full Trace
                                </div>
                              }
                              onClose={handleClose}
                              open={isModalVisible}
                              title="Full Exception Trace"
                            >
                              <div className="mb-6">
                                {!isCopyClicked ? (
                                  <Button
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        indexAttemptToDisplayTraceFor?.full_exception_trace ||
                                          ""
                                      );
                                      setIsCopyClicked(true);
                                      setTimeout(
                                        () => setIsCopyClicked(false),
                                        2000
                                      );
                                    }}
                                  >
                                    Copy full trace
                                    <CopyIcon />
                                  </Button>
                                ) : (
                                  <Button>
                                    Copied to clipboard
                                    <CheckmarkIcon size={16} />
                                  </Button>
                                )}
                              </div>
                              <div className="whitespace-pre-wrap">
                                {
                                  indexAttemptToDisplayTraceFor?.full_exception_trace
                                }
                              </div>
                            </CustomModal>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {ccPair.index_attempts.length > NUM_IN_PAGE && (
        <div className="pt-6 flex">
          <div className="mx-auto">
            <PageSelector
              totalPages={Math.ceil(ccPair.index_attempts.length / NUM_IN_PAGE)}
              currentPage={page}
              onPageChange={(newPage) => {
                setPage(newPage);
                window.scrollTo({
                  top: 0,
                  left: 0,
                  behavior: "smooth",
                });
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
