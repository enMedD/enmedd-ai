import { User, UserRole } from "@/lib/types";
import {
  AuthTypeMetadata,
  getAuthTypeMetadataSS,
  getCurrentTeamspaceUserSS,
  getCurrentUserSS,
} from "@/lib/userSS";
import { redirect } from "next/navigation";
import { HealthCheckBanner } from "../health/healthcheck";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { GlobalSidebar } from "../globalSidebar/GlobalSidebar";

export async function Layout({
  children,
  isTeamspace,
  teamspaceId,
}: {
  children: React.ReactNode;
  isTeamspace?: boolean;
  teamspaceId?: string;
}) {
  const tasks = [
    getAuthTypeMetadataSS(),
    getCurrentUserSS(),
    teamspaceId ? getCurrentTeamspaceUserSS(teamspaceId) : null,
  ];

  // catch cases where the backend is completely unreachable here
  // without try / catch, will just raise an exception and the page
  // will not render
  let results: (User | AuthTypeMetadata | null)[] = [null, null];
  try {
    results = await Promise.all(tasks);
  } catch (e) {
    console.log(`Some fetch failed for the main search page - ${e}`);
  }

  const authTypeMetadata = results[0] as AuthTypeMetadata | null;
  const user = teamspaceId
    ? (results[2] as User | null)
    : (results[1] as User | null);

  const authDisabled = authTypeMetadata?.authType === "disabled";
  const requiresVerification = authTypeMetadata?.requiresVerification;

  if (!authDisabled) {
    if (!user) {
      return redirect("/auth/login");
    }
    if (user.role === UserRole.BASIC) {
      return redirect("/");
    }
    if (!user.is_verified && requiresVerification) {
      return redirect("/auth/waiting-on-verification");
    }
  }

  return (
    <>
      <HealthCheckBanner />
      <SidebarProvider
        style={
          {
            "--sidebar-width": "350px",
          } as React.CSSProperties
        }
        className="h-full w-full"
      >
        <GlobalSidebar user={user}>
          <AdminSidebar />
        </GlobalSidebar>
        <SidebarInset className="w-full overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 absolute top-0">
            <SidebarTrigger className="-ml-1" />
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
