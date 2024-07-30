"use client";

import { BasicClickable } from "@/components/BasicClickable";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import {
  FiEdit,
  FiFolderPlus,
  FiMessageSquare,
  FiSearch,
  FiX,
} from "react-icons/fi";
import {
  NEXT_PUBLIC_DO_NOT_USE_TOGGLE_OFF_DANSWER_POWERED,
  NEXT_PUBLIC_NEW_CHAT_DIRECTS_TO_SAME_PERSONA,
} from "@/lib/constants";

import { usePopup } from "@/components/admin/connectors/Popup";
import { SettingsContext } from "@/components/settings/SettingsProvider";

import { FaHeadset } from "react-icons/fa";
/* import { Logo } from "@/components/Logo"; */
import { UserSettingsButton } from "@/components/UserSettingsButton";
import { HeaderTitle } from "@/components/header/Header";
import Logo from '../../../public/logo-brand.png'
import { useChatContext } from "@/components/context/ChatContext";
import { User } from "@/lib/types";

export const SearchSidebar = ({
  user,
  handleClose,
  openSidebar,
}: {
  user : User | null;
  handleClose?: () => void;
  openSidebar?: boolean;
}) => {
  const router = useRouter();
  const { popup, setPopup } = usePopup();

  const combinedSettings = useContext(SettingsContext);
  if (!combinedSettings) {
    return null;
  }
  const settings = combinedSettings.settings;
  const enterpriseSettings = combinedSettings.enterpriseSettings;

  return (
    <>
      {popup}
      <div
        className={`py-4
        flex-none
        bg-background-weak
        border-r 
        border-border 
        flex-col 
        h-screen
        transition-transform z-30 ${
          openSidebar ? "w-full md:w-80 left-0 absolute flex" : "hidden lg:flex"
        }`}
        id="chat-sidebar"
      >
        <div className="flex">
          <div
            className="w-full"
            /*  href={
              settings && settings.default_page === "chat" ? "/chat" : "/search"
            } */
          >
            <div className="flex items-center w-full px-4">
              <div className="flex items-center justify-between w-full">
                <Image className="mx-auto" src={Logo} alt="enmedd-logo" width={112} />
                <FiX onClick={handleClose} className="lg:hidden" />
              </div>

              {enterpriseSettings && enterpriseSettings.application_name ? (
                <div>
                  <HeaderTitle>
                    {enterpriseSettings.application_name}
                  </HeaderTitle>

                  {!NEXT_PUBLIC_DO_NOT_USE_TOGGLE_OFF_DANSWER_POWERED && (
                    <p className="text-xs text-subtle -mt-1.5">
                      Powered by Vanguard AI
                    </p>
                  )}
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
        {/* <HeaderTitle>enMedD CHP</HeaderTitle> */}
        {
          <div className="mt-5">
            {settings.search_page_enabled && (
              <Link
                href="/search"
                className="flex px-4 py-2 rounded cursor-pointer hover:bg-hover-light"
              >
                <FiSearch className="my-auto mr-2 text-base" />
                Search
              </Link>
            )}
            {settings.chat_page_enabled && (
              <>
                <Link
                  href="/chat"
                  className="flex px-4 py-2 rounded cursor-pointer hover:bg-hover-light"
                >
                  <FiMessageSquare className="my-auto mr-2 text-base" />
                  Chat
                </Link>
                <Link
                  href="/assistants/mine"
                  className="flex px-4 py-2 rounded cursor-pointer hover:bg-hover-light"
                >
                  <FaHeadset className="my-auto mr-2 text-base" />
                  My Assistants
                </Link>
              </>
            )}
          </div>
        }
        <div className="pb-4 mt-auto mx-3 border-b border-border" />
        <UserSettingsButton user={user} />
      </div>
    </>
  );
};
