import { errorHandlingFetcher } from "@/lib/fetcher";
import useSWR, { mutate } from "swr";
import {
  ChatSessionMinimal,
  QueryAnalytics,
  UserAnalytics,
} from "./usage/types";
import { useState } from "react";
import { buildApiPath } from "@/lib/urlBuilder";
import { Feedback } from "@/lib/types";
import { DateRangePickerValue } from "@tremor/react";
import {
  convertDateToEndOfDay,
  convertDateToStartOfDay,
  getXDaysAgo,
} from "./dateUtils";
import { DateRange } from "react-day-picker";

export const useTimeRange = () => {
  return useState<DateRange>({
    to: new Date(),
    from: getXDaysAgo(30),
  });
};

export const useQueryAnalytics = (
  timeRange: DateRange,
  teamspaceId?: string | string[]
) => {
  const url = buildApiPath(
    `/api/analytics/admin/query${
      teamspaceId ? `?teamspace_id=${teamspaceId}` : ""
    }${
      timeRange.from && timeRange.to
        ? `&start=${convertDateToStartOfDay(timeRange.from)?.toISOString()}&end=${convertDateToEndOfDay(timeRange.to)?.toISOString()}`
        : ""
    }`
  );

  const swrResponse = useSWR<QueryAnalytics[]>(url, errorHandlingFetcher);

  return {
    ...swrResponse,
    refreshQueryAnalytics: () => mutate(url),
  };
};

export const useUserAnalytics = (
  timeRange: DateRange,
  teamspaceId?: string | string[]
) => {
  const url = buildApiPath(
    `/api/analytics/admin/user${
      teamspaceId ? `?teamspace_id=${teamspaceId}` : ""
    }${
      timeRange.from && timeRange.to
        ? `&start=${convertDateToStartOfDay(timeRange.from)?.toISOString()}&end=${convertDateToEndOfDay(timeRange.to)?.toISOString()}`
        : ""
    }`
  );

  const swrResponse = useSWR<UserAnalytics[]>(url, errorHandlingFetcher);

  return {
    ...swrResponse,
    refreshUserAnalytics: () => mutate(url),
  };
};

export const useQueryHistory = (teamspaceId?: string) => {
  const [selectedFeedbackType, setSelectedFeedbackType] =
    useState<Feedback | null>(null);
  const [timeRange, setTimeRange] = useTimeRange();

  // Ensure query parameters are separated correctly
  const queryParams = {
    teamspace_id: teamspaceId,
    feedback_type: selectedFeedbackType,
    start: convertDateToStartOfDay(timeRange.from)?.toISOString(),
    end: convertDateToEndOfDay(timeRange.to)?.toISOString(),
  };

  // Construct the URL with query parameters
  const url = buildApiPath("/api/admin/chat-session-history", queryParams);
  const swrResponse = useSWR<ChatSessionMinimal[]>(url, errorHandlingFetcher);

  return {
    ...swrResponse,
    selectedFeedbackType,
    setSelectedFeedbackType: (feedbackType: Feedback | "all") =>
      setSelectedFeedbackType(feedbackType === "all" ? null : feedbackType),
    timeRange,
    setTimeRange,
    refreshQueryHistory: () => mutate(url),
  };
};

export function getDatesList(startDate: Date, endDate: Date): string[] {
  const datesList: string[] = [];
  const currentDate = new Date();

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]; // convert date object to 'YYYY-MM-DD' format
    datesList.push(dateStr);
  }

  if (endDate.toDateString() === currentDate.toDateString()) {
    const todayStr = currentDate.toISOString().split("T")[0];
    if (!datesList.includes(todayStr)) {
      datesList.push(todayStr);
    }
  }

  return datesList;
}
