import { Layout } from "@/components/admin/Layout";

export default async function TeamspaceAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isTeamspace = true;

  return await Layout({ children, isTeamspace });
}
