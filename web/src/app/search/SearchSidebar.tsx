"use client";

import React from "react";
import {
  Search,
  MessageCircleMore,
  Headset,
  PanelLeftClose,
  Command,
} from "lucide-react";
import { useContext } from "react";
import Link from "next/link";
import Image from "next/image";

import EnmeddLogo from "../../../public/logo-brand.png";
import { HeaderTitle } from "@/components/header/Header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NEXT_PUBLIC_DO_NOT_USE_TOGGLE_OFF_ENMEDD_POWERED } from "@/lib/constants";
import { SettingsContext } from "@/components/settings/SettingsProvider";
import { Logo } from "@/components/Logo";

export const SearchSidebar = ({
  isExpanded,
  openSidebar,
  toggleSideBar,
}: {
  isExpanded?: boolean;
  openSidebar?: boolean;
  toggleSideBar?: () => void;
}) => {
  const combinedSettings = useContext(SettingsContext);
  if (!combinedSettings) {
    return null;
  }
  const settings = combinedSettings.settings;
  const workspaces = combinedSettings.workspaces;

  return (
    <>
      <div
        className={`
            flex-col 
            h-full
            flex
            z-overlay
            w-full py-4
            `}
        id="chat-sidebar"
      >
        <div className="flex items-center gap-2 w-full relative justify-between px-4 pb-4">
          <div className="flex">
            {workspaces && workspaces.workspace_name ? (
              <Image src={EnmeddLogo} alt="enmedd-logo" height={40} />
            ) : (
              <Image src={EnmeddLogo} alt="enmedd-logo" height={40} />
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSideBar}
            className="lg:hidden"
          >
            <PanelLeftClose size={24} />
          </Button>
        </div>

        <div className="h-full overflow-y-auto">
          <div className="px-4 text-sm font-medium flex flex-col">
            {settings.search_page_enabled && (
              <>
                <Separator className="mb-4" />
                <Link
                  href="/search"
                  className={`flex px-4 py-2 h-10 rounded-regular cursor-pointer bg-primary text-white items-center gap-2 justify-between`}
                >
                  <div className="flex items-center gap-2">
                    <Search size={16} className="shrink-0" />
                    Search
                  </div>
                  <div className="flex items-center gap-1 font-normal">
                    <Command size={14} />S
                  </div>
                </Link>
              </>
            )}
            {settings.chat_page_enabled && (
              <>
                <Link
                  href="/chat"
                  className={`flex px-4 py-2 h-10 rounded-regular cursor-pointer hover:bg-hover-light items-center gap-2 justify-between`}
                >
                  <div className="flex items-center gap-2">
                    <MessageCircleMore size={16} className="shrink-0" />
                    Chat
                  </div>

                  <div className="flex items-center gap-1 font-normal">
                    <Command size={14} />D
                  </div>
                </Link>
                {/* {combinedSettings.featureFlags.explore_assistants && (
                  <Link
                    href="/assistants/mine"
                    className="flex px-4 py-2 h-10 rounded-regular cursor-pointer hover:bg-hover-light items-center gap-2"
                  >
                    <Headset size={16} />
                    <span className="truncate">Explore Assistants</span>
                  </Link>
                )} */}
              </>
            )}
            <Separator className="mt-4" />
          </div>
        </div>
      </div>
    </>
  );
};
