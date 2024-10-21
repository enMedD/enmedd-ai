"use client";

import { useState, useRef, useContext } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { User as UserTypes } from "@/lib/types";
import { checkUserIsNoAuthUser, logout } from "@/lib/user";
import { BasicSelectable } from "@/components/BasicClickable";
import { Popover } from "./popover/Popover";
import { FaBrain } from "react-icons/fa";
import { LOGOUT_DISABLED } from "@/lib/constants";
import { SettingsContext } from "./settings/SettingsProvider";
import { LogOut, MessageSquare, Search, User, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function UserDropdown({
  user,
  hideChatAndSearch,
}: {
  user: UserTypes | null;
  hideChatAndSearch?: boolean;
}) {
  const { teamspaceId } = useParams();
  const [userInfoVisible, setUserInfoVisible] = useState(false);
  const { toast } = useToast();
  const userInfoRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const combinedSettings = useContext(SettingsContext);
  if (!combinedSettings) {
    return null;
  }
  const settings = combinedSettings.settings;

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
      <Popover
        open={userInfoVisible}
        onOpenChange={setUserInfoVisible}
        content={
          <BasicSelectable padding={false} selected={false}>
            <div
              onClick={() => setUserInfoVisible(!userInfoVisible)}
              className="flex cursor-pointer"
            >
              <div className="px-2 my-auto text-base font-normal bg-blue-400 rounded-regular hover:bg-blue-400-hover">
                {user && user.email ? (
                  user.email[0].toUpperCase()
                ) : (
                  <User size={25} className="mx-auto" />
                )}
              </div>
            </div>
          </BasicSelectable>
        }
        popover={
          <div
            className={`
                text-strong 
                text-sm
                border 
                border-border 
                bg-background
                rounded-regular
                shadow-lg 
                flex 
                flex-col 
                w-full 
                max-h-96 
                overflow-y-auto 
                p-1
                overscroll-contain
              `}
          >
            {!hideChatAndSearch && (
              <>
                {settings.search_page_enabled && (
                  <Link
                    href={teamspaceId ? `/t/${teamspaceId}/search` : "/search"}
                    className="flex px-4 py-3 rounded cursor-pointer hover:bg-hover-light"
                  >
                    <Search className="my-auto mr-2 text-lg" />
                    Search
                  </Link>
                )}
                {settings.chat_page_enabled && (
                  <>
                    <Link
                      href={teamspaceId ? `/t/${teamspaceId}/chat` : "/chat"}
                      className="flex px-4 py-3 rounded cursor-pointer hover:bg-hover-light"
                    >
                      <MessageSquare className="my-auto mr-2 text-lg" />
                      Chat
                    </Link>
                    <Link
                      href="/assistants/mine"
                      className="flex px-4 py-3 rounded cursor-pointer hover:bg-hover-light"
                    >
                      <FaBrain className="my-auto mr-2 text-lg" />
                      My Assistants
                    </Link>
                  </>
                )}
              </>
            )}
            {showAdminPanel && (
              <>
                {!hideChatAndSearch && (
                  <div className="my-1 border-t border-border" />
                )}
                <Link
                  href={
                    teamspaceId
                      ? `/t/${teamspaceId}/admin/indexing/status`
                      : "/admin/indexing/status"
                  }
                  className="flex px-4 py-3 rounded cursor-pointer hover:bg-hover-light"
                >
                  <Wrench className="my-auto mr-2 text-lg" />
                  Admin Panel
                </Link>
              </>
            )}
            {showLogout && (
              <>
                {(!hideChatAndSearch || showAdminPanel) && (
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
        }
        side="bottom"
        align="end"
        sideOffset={5}
        alignOffset={-10}
      />
    </div>
  );
}
