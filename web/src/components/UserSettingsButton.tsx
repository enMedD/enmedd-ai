"use client";

import { useState, useRef, useContext } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { User as UserTypes } from "@/lib/types";
import { checkUserIsNoAuthUser, logout } from "@/lib/user";
import { LOGOUT_DISABLED } from "@/lib/constants";
import { LogOut, MessageCircleMore, User, Wrench } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { SettingsContext } from "./settings/SettingsProvider";
import { UserProfile } from "./UserProfile";
import { useToast } from "@/hooks/use-toast";

export function UserSettingsButton({
  user,
  defaultPage,
}: {
  user?: UserTypes | null;
  defaultPage?: string;
}) {
  const [userInfoVisible, setUserInfoVisible] = useState(false);
  const { toast } = useToast();
  const userInfoRef = useRef<HTMLDivElement>(null);
  const settings = useContext(SettingsContext);
  const router = useRouter();
  const { teamspaceId } = useParams();

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

  const showAdminPanel = !user || user.role === "admin";
  const showLogout =
    user && !checkUserIsNoAuthUser(user.id) && !LOGOUT_DISABLED;

  return (
    <div className="relative" ref={userInfoRef}>
      <Popover>
        <PopoverTrigger
          onClick={() => setUserInfoVisible(!userInfoVisible)}
          className="w-full relative cursor-pointer"
        >
          <UserProfile
            user={user}
            onClick={() => setUserInfoVisible(!userInfoVisible)}
          />
        </PopoverTrigger>
        <PopoverContent
          className="w-[250px] !z-modal mb-2 ml-4 text-sm"
          side="right"
          align="end"
          sideOffset={-5}
          alignOffset={-10}
        >
          <div className="w-full">
            <>
              <div className="flex py-3 px-4 rounded-regular items-center gap-3 group">
                <UserProfile user={user} />
                <div className="flex flex-col w-[160px]">
                  <span className="truncate">
                    {user?.full_name || "Unknown User"}
                  </span>
                  <span className="text-dark-500 truncate">
                    {user?.email || "anonymous@gmail.com"}
                  </span>
                </div>
              </div>
              <div className="my-1 border-b border-border" />
            </>
            {settings?.featureFlags.profile_page && (
              <Link
                href="/profile"
                className="flex py-3 px-4 cursor-pointer rounded-regular hover:bg-primary hover:text-inverted"
              >
                <User className="my-auto mr-3" size={24} strokeWidth={1.5} />
                Profile Settings
              </Link>
            )}
            <Link
              // redirect to default page
              href={
                teamspaceId
                  ? `/t/${teamspaceId}/${defaultPage}`
                  : `/${defaultPage}`
              }
              className="flex py-3 px-4 cursor-pointer rounded-regular hover:bg-primary hover:text-inverted"
            >
              <MessageCircleMore
                className="my-auto mr-3"
                size={24}
                strokeWidth={1.5}
              />
              Chat & Search
            </Link>
            {showAdminPanel && (
              <>
                <Link
                  href={
                    teamspaceId
                      ? `/t/${teamspaceId}/admin/indexing/status`
                      : "/admin/indexing/status"
                  }
                  className="flex py-3 px-4 cursor-pointer rounded-regular hover:bg-primary hover:text-inverted"
                >
                  <Wrench
                    className="my-auto mr-3"
                    size={24}
                    strokeWidth={1.5}
                  />
                  {teamspaceId ? "Teamspace" : "Workspace"} Admin Panel
                </Link>
              </>
            )}
            {showLogout && (
              <>
                {showAdminPanel && (
                  <div className="my-1 border-t border-border" />
                )}
                <div
                  onClick={handleLogout}
                  className="mt-1 flex py-3 px-4 cursor-pointer hover:bg-destructive hover:text-inverted rounded-regular"
                >
                  <LogOut
                    className="my-auto mr-3"
                    size={24}
                    strokeWidth={1.5}
                  />
                  Log out
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
