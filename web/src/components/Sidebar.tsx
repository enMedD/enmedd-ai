import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { GlobalSidebar } from "@/components/globalSidebar/GlobalSidebar";
import { User } from "@/lib/types";

export default function Sidebar({
  children,
  sidebar,
  user,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  user: User | null;
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
      className="h-full w-full"
    >
      <GlobalSidebar user={user}>{sidebar}</GlobalSidebar>
      <SidebarInset className="w-full overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 absolute top-0">
          <SidebarTrigger className="-ml-1" />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
