"use client";

import { errorHandlingFetcher } from "@/lib/fetcher";

import useSWR from "swr";
import { useState } from "react";
import { UsageReport } from "./types";
import { ThreeDotsLoader } from "@/components/Loading";
import Link from "next/link";
import { humanReadableFormat, humanReadableFormatWithTime } from "@/lib/time";
import { ErrorCallout } from "@/components/ErrorCallout";
import { PageSelector } from "@/components/PageSelector";
import { Button } from "@/components/ui/button";
import { CloudDownload, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomDatePicker } from "@/components/CustomDatePicker";
import { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CustomTooltip } from "@/components/CustomTooltip";

const predefinedRanges = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "today", label: "Today" },
  { value: "allTime", label: "All Time" },
  { value: "lastYear", label: "Last Year" },
];

function GenerateReportInput() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const [errorOccurred, setErrorOccurred] = useState<Error | null>(null);

  const download = (bytes: Blob) => {
    let elm = document.createElement("a");
    elm.href = URL.createObjectURL(bytes);
    elm.setAttribute("download", "usage_reports.zip");
    elm.click();
  };

  const requestReport = async () => {
    setIsLoading(true);
    setErrorOccurred(null);
    try {
      let period_from: string | null = null;
      let period_to: string | null = null;

      if (dateRange?.from && dateRange?.to) {
        period_from = dateRange.from.toISOString();
        period_to = dateRange.to.toISOString();
      }

      const res = await fetch("/api/admin/generate-usage-report", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          period_from: period_from,
          period_to: period_to,
        }),
      });

      if (!res.ok) {
        throw Error(`Received an error: ${res.statusText}`);
      }

      const report = await res.json();
      const transfer = await fetch(
        `/api/admin/usage-report/${report.report_name}`
      );

      const bytes = await transfer.blob();
      download(bytes);
    } catch (e) {
      setErrorOccurred(e as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date();

  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 7);

  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);

  const lastYear = new Date();
  lastYear.setFullYear(today.getFullYear() - 1);

  return (
    <div className="flex gap-4 flex-col md:flex-row justify-between md:items-center">
      <div>
        <div className="flex flex-col">
          <h3>Generate Usage Reports</h3>
          <span className="text-subtle text-sm">
            Generate usage statistics for users in the workspace.
          </span>
        </div>
        <div className="pt-4">
          <CustomDatePicker
            value={dateRange}
            onValueChange={setDateRange}
            predefinedRanges={predefinedRanges}
          />
        </div>
      </div>
      <div>
        <Button disabled={isLoading} onClick={() => requestReport()}>
          <CloudDownload size={16} /> Generate Report
        </Button>
        <p className="pt-2 text-xs text-subtle">This can take a few minutes.</p>
        {errorOccurred && (
          <ErrorCallout
            errorTitle="Something went wrong."
            errorMsg={errorOccurred?.toString()}
          />
        )}
      </div>
    </div>
  );
}

const USAGE_REPORT_URL = "/api/admin/usage-report";

function UsageReportsTable() {
  const [page, setPage] = useState(1);
  const NUM_IN_PAGE = 10;

  const {
    data: usageReportsMetadata,
    error: usageReportsError,
    isLoading: usageReportsIsLoading,
  } = useSWR<UsageReport[]>(USAGE_REPORT_URL, errorHandlingFetcher);

  const paginatedReports = usageReportsMetadata
    ? usageReportsMetadata
        .slice(0)
        .reverse()
        .slice(NUM_IN_PAGE * (page - 1), NUM_IN_PAGE * page)
    : [];

  const totalPages = usageReportsMetadata
    ? Math.ceil(usageReportsMetadata.length / NUM_IN_PAGE)
    : 0;

  return (
    <div>
      <h3 className="pt-8 pb-4">Previous Reports</h3>
      {usageReportsIsLoading ? (
        <div className="flex justify-center w-full">
          <ThreeDotsLoader />
        </div>
      ) : usageReportsError ? (
        <ErrorCallout
          errorTitle="Something went wrong."
          errorMsg={(usageReportsError as Error).toString()}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Generated By</TableHead>
                  <TableHead>Time Generated</TableHead>
                  <TableHead>Download</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedReports.map((r) => (
                  <TableRow key={r.report_name}>
                    <TableCell>
                      {r.report_name.split("_")[1]?.substring(0, 8) ||
                        r.report_name.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      {r.period_from
                        ? `${humanReadableFormat(
                            r.period_from
                          )} - ${humanReadableFormat(r.period_to!)}`
                        : "All time"}
                    </TableCell>
                    <TableCell>{r.requestor ?? "Auto generated"}</TableCell>
                    <TableCell>
                      {humanReadableFormatWithTime(r.time_created)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/api/admin/usage-report/${r.report_name}`}>
                        <CustomTooltip
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Download size={16} />
                            </Button>
                          }
                          asChild
                        >
                          Download
                        </CustomTooltip>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function UsageReports() {
  const [page, setPage] = useState(1);
  const NUM_IN_PAGE = 10;

  const {
    data: usageReportsMetadata,
    error: usageReportsError,
    isLoading: usageReportsIsLoading,
  } = useSWR<UsageReport[]>(USAGE_REPORT_URL, errorHandlingFetcher);

  const paginatedReports = usageReportsMetadata
    ? usageReportsMetadata
        .slice(0)
        .reverse()
        .slice(NUM_IN_PAGE * (page - 1), NUM_IN_PAGE * page)
    : [];

  const totalPages = usageReportsMetadata
    ? Math.ceil(usageReportsMetadata.length / NUM_IN_PAGE)
    : 0;

  return (
    <div className="space-y-12">
      <div>
        <GenerateReportInput />
        <div className="p-0">
          <UsageReportsTable />
        </div>
      </div>

      <div className="flex">
        <div className="mx-auto">
          <PageSelector
            totalPages={totalPages}
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
    </div>
  );
}
