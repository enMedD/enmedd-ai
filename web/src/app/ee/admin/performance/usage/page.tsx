"use client";

import { AdminPageTitle } from "@/components/admin/Title";
import { Divider } from "@tremor/react";
import { FiActivity } from "react-icons/fi";
import { DateRangeSelector } from "../DateRangeSelector";
import { useTimeRange } from "../lib";
import { FeedbackChart } from "./FeedbackChart";
import { QueryPerformanceChart } from "./QueryPerformanceChart";
import UsageReports from "./UsageReports";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useTimeRange();

  return (
    <main className="py-24 md:py-32 lg:pt-16">
      {/* TODO: remove this `dark` once we have a mode selector */}
      <AdminPageTitle
        title="Usage Statistics"
        icon={<FiActivity size={32} />}
      />

      <div className="mb-24 space-y-8">
        <div>
          <DateRangeSelector value={timeRange} onValueChange={setTimeRange} />
        </div>
        <QueryPerformanceChart timeRange={timeRange} />
        <FeedbackChart timeRange={timeRange} />
      </div>
      <UsageReports />
    </main>
  );
}
