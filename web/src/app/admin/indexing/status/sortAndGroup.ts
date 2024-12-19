import { ConnectorIndexingStatus, ValidStatuses } from "@/lib/types";

interface Status {
  cc_pair_status: string;
  last_status?: ValidStatuses | null;
}

const statusLabels: { [key: string]: string } = {
  success: "Success",
  in_progress: "In Progress",
  not_started: "Scheduled",
  failed: "Failed",
  completed_with_errors: "Completed with errors",
};

export const compareValues = (
  valueA: string | number,
  valueB: string | number,
  order: "asc" | "desc"
) => {
  const isDescending = order === "desc";
  if (isDescending) {
    return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
  } else {
    return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
  }
};

export const getActivityLabel = (status: Status): string => {
  const ccPairStatus = status.cc_pair_status.toLowerCase();
  if (ccPairStatus === "active") {
    const ccPairLastStatus = status.last_status
      ? status.last_status.toLowerCase()
      : "";
    switch (ccPairLastStatus) {
      case "in_progress":
        return "in_progress";
      case "not_started":
        return "not_started";
      default:
        return "Active";
    }
  }
  return ccPairStatus;
};

export const sortConnectors = (
  connectors: ConnectorIndexingStatus<any, any>[],
  selectedSort: string | null,
  sortOrder: "asc" | "desc",
  selectedGroup: string | null,
  groupOrder: "asc" | "desc"
) => {
  const statusOrder: { [key: string]: number } = {
    success: 1,
    in_progress: 2,
    not_started: 3,
    completed_with_errors: 4,
    failed: 5,
  };

  return connectors.sort((a, b) => {
    if (selectedGroup) {
      if (selectedGroup === "Activity") {
        return compareValues(
          getActivityLabel(a),
          getActivityLabel(b),
          groupOrder
        );
      }
      if (selectedGroup === "Permission") {
        return compareValues(
          a.access_type.toLowerCase(),
          b.access_type.toLowerCase(),
          groupOrder
        );
      }
      if (selectedGroup === "Last Status") {
        const statusA = a.last_status
          ? statusOrder[a.last_status]
          : Number.MAX_VALUE;
        const statusB = b.last_status
          ? statusOrder[b.last_status]
          : Number.MAX_VALUE;
        return compareValues(statusA, statusB, groupOrder);
      }
    }

    if (selectedSort) {
      if (selectedSort === "Activity") {
        return compareValues(
          getActivityLabel(a),
          getActivityLabel(b),
          sortOrder
        );
      }
      if (selectedSort === "Permission") {
        return compareValues(
          a.access_type.toLowerCase(),
          b.access_type.toLowerCase(),
          sortOrder
        );
      }
      if (selectedSort === "Last Status") {
        const statusA = a.last_status ? statusLabels[a.last_status] : "";
        const statusB = b.last_status ? statusLabels[b.last_status] : "";
        return compareValues(statusA, statusB, sortOrder);
      }
      if (selectedSort === "Total Docs") {
        return compareValues(
          Number(a.docs_indexed),
          Number(b.docs_indexed),
          sortOrder
        );
      }
    }

    return 0;
  });
};

export const groupConnectorsByStatus = (
  connectors: ConnectorIndexingStatus<any, any>[],
  selectedGroup: string | null
) => {
  return connectors.reduce(
    (acc, connector) => {
      let groupKey: string;

      switch (selectedGroup) {
        case "Activity":
          const ccPairStatus = connector.cc_pair_status.toLowerCase();
          if (ccPairStatus === "active") {
            const ccPairLastStatus = connector.last_status
              ? connector.last_status.toLowerCase()
              : "";
            groupKey =
              ccPairLastStatus === "in_progress"
                ? "in_progress"
                : ccPairLastStatus === "not_started"
                  ? "not_started"
                  : "Active";
          } else {
            groupKey = ccPairStatus;
          }
          break;

        case "Last Status":
          groupKey = connector.last_status || "unknown";
          break;

        case "Permission":
          groupKey =
            connector.access_type?.toLowerCase() === "private"
              ? "Private"
              : "Public";
          break;

        default:
          groupKey = connector.cc_pair_status || "unknown";
          break;
      }

      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(connector);
      return acc;
    },
    {} as Record<string, ConnectorIndexingStatus<any, any>[]>
  );
};

export const filterConnectors = ({
  source,
  searchTerm,
  activityFilter,
  permissionsFilter,
  docsFilter,
  statusFilter,
  groupedStatuses,
}: {
  source: string;
  searchTerm: string;
  activityFilter: string | null;
  permissionsFilter: string | null;
  docsFilter: number | null;
  statusFilter: string | null;
  groupedStatuses: Record<string, ConnectorIndexingStatus<any, any>[]>;
}) => {
  return groupedStatuses[source].filter((status) => {
    const nameMatches = (status.name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    let matchesActivity = true;
    let matchesPermissions = true;
    let matchesDocs = true;
    let matchesStatus = true;

    if (activityFilter) {
      const ccPairStatus = status.cc_pair_status.toLowerCase();

      if (ccPairStatus === "active") {
        const ccPairLastStatus = status.last_status
          ? status.last_status.toLowerCase()
          : "";

        switch (ccPairLastStatus) {
          case "in_progress":
            matchesActivity = activityFilter.toLowerCase() === "in_progress";
            break;
          case "not_started":
            matchesActivity = activityFilter.toLowerCase() === "not_started";
            break;
          default:
            matchesActivity = activityFilter.toLowerCase() === "active";
            break;
        }
      } else {
        matchesActivity = ccPairStatus.includes(activityFilter.toLowerCase());
      }
    }

    if (permissionsFilter) {
      matchesPermissions = status.access_type
        .toLowerCase()
        .includes(permissionsFilter.toLowerCase());
    }

    if (docsFilter !== null) {
      if (docsFilter === 0) {
        matchesDocs = status.docs_indexed === 0;
      } else {
        matchesDocs = status.docs_indexed >= docsFilter;
      }
    }

    if (statusFilter && status.last_status) {
      matchesStatus = status.last_status
        .toLowerCase()
        .includes(statusFilter.toLowerCase());
    }

    return (
      nameMatches &&
      matchesActivity &&
      matchesPermissions &&
      matchesDocs &&
      matchesStatus
    );
  });
};
