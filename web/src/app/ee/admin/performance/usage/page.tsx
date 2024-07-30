"use client";

import { AdminPageTitle } from "@/components/admin/Title";
import { Divider } from "@tremor/react";
import { FiActivity } from "react-icons/fi";
import { DateRangeSelector } from "../DateRangeSelector";
import { useTimeRange } from "../lib";
import { FeedbackChart } from "./FeedbackChart";
import { QueryPerformanceChart } from "./QueryPerformanceChart";
import UsageReports from "./UsageReports";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useTimeRange();

  return (
    <main className="pt-4 mx-auto container">
      {/* TODO: remove this `dark` once we have a mode selector */}
      <AdminPageTitle
        title="Usage Statistics"
        icon={<FiActivity size={32} />}
      />

      <DateRangeSelector value={timeRange} onValueChange={setTimeRange} />

      <QueryPerformanceChart timeRange={timeRange} />
      <FeedbackChart timeRange={timeRange} />
      <Divider />
      <UsageReports />
    </main>
  );
}
