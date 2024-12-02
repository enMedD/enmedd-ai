"use client";

import {
  LogOut,
  MessageCircleMore,
  User as UserIcon,
  Wrench,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useContext } from "react";
import { SettingsContext } from "./settings/SettingsProvider";
import Link from "next/link";
import { useUser } from "./user/UserProvider";
import { checkUserIsNoAuthUser, logout } from "@/lib/user";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { LOGOUT_DISABLED } from "@/lib/constants";
import { FeatureFlagWrapper } from "./feature_flag/FeatureFlagWrapper";
import { UserProfile } from "./UserProfile";

export function UserSettingsButton({ defaultPage }: { defaultPage?: string }) {
  const router = useRouter();
  const { teamspaceId } = useParams();
  const { toast } = useToast();
  const { isMobile } = useSidebar();
  const { user, isAdmin, isTeamspaceAdmin } = useUser();

  const combinedSettings = useContext(SettingsContext);
  if (!combinedSettings) {
    return null;
  }
  const settings = useContext(SettingsContext);

  const handleLogout = () => {
    logout().then((isSuccess) => {
      if (!isSuccess) {
        toast({
          title: "Logout Failed",
          description: "There was an issue logging out. Please try again.",
          variant: "destructive",
        });
      }
      router.push("/auth/login");
    });
  };

  const showLogout =
    user && !checkUserIsNoAuthUser(user.id) && !LOGOUT_DISABLED;

  return (
    <SidebarMenu className="items-center">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="p-0 !size-9">
              <UserProfile user={user} size={36} textSize="sm" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserProfile user={user} size={32} textSize="sm" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user?.full_name}
                  </span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex gap-2 items-center">
                  <FeatureFlagWrapper flag="profile_page">
                    <UserIcon size={16} strokeWidth={1.5} />
                    Profile Settings
                  </FeatureFlagWrapper>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href={
                    teamspaceId
                      ? `/t/${teamspaceId}/${defaultPage}`
                      : `/${defaultPage}`
                  }
                  className="flex gap-2 items-center"
                >
                  <MessageCircleMore size={16} strokeWidth={1.5} />
                  Chat & Search
                </Link>
              </DropdownMenuItem>

              {isTeamspaceAdmin && (
                <DropdownMenuItem asChild>
                  <Link
                    href={`/t/${teamspaceId}/admin/indexing/status`}
                    className="flex gap-2 items-center"
                  >
                    <Wrench size={16} strokeWidth={1.5} />
                    Teamspace Admin Panel
                  </Link>
                </DropdownMenuItem>
              )}

              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin/indexing/status"
                    className="flex gap-2 items-center"
                  >
                    <Wrench size={16} strokeWidth={1.5} />
                    Workspace Admin Panel
                  </Link>
                </DropdownMenuItem>
              )}

              {showLogout && (
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="focus:bg-destructive-500"
                >
                  <LogOut size={16} strokeWidth={1.5} />
                  Log out
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
