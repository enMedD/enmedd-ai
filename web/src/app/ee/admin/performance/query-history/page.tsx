"use client";

import { AdminPageTitle } from "@/components/admin/Title";
import { DatabaseIcon } from "@/components/icons/icons";
import { QueryHistoryTable } from "./QueryHistoryTable";

export default function QueryHistoryPage() {
  return (
    <main className="pt-4 mx-auto container">
      <AdminPageTitle title="Query History" icon={<DatabaseIcon size={32} />} />

      <QueryHistoryTable />
    </main>
  );
}
