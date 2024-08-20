"use client";

import { User } from "@/lib/types";
import Link from "next/link";
import { useContext, useState } from "react";

import { NEXT_PUBLIC_DO_NOT_USE_TOGGLE_OFF_DANSWER_POWERED } from "@/lib/constants";
import Image from "next/image";
import { FiMenu, FiMessageSquare, FiSearch } from "react-icons/fi";
import Logo from "../../../public/logo-brand.png";
import { SideBar } from "../SideBar";
import { SettingsContext } from "../settings/SettingsProvider";
import { HeaderWrapper } from "./HeaderWrapper";

export function HeaderTitle({ children }: { children: JSX.Element | string }) {
  return (
    <h1 className="flex text-2xl font-bold text-tremor-brand">{children}</h1>
  );
}

interface HeaderProps {
  user: User | null;
}

export function Header({ user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const combinedSettings = useContext(SettingsContext);
  if (!combinedSettings) {
    return null;
  }
  const settings = combinedSettings.settings;
  const enterpriseSettings = combinedSettings.enterpriseSettings;

  const handleClose = () => {
    setIsMenuOpen(false);
  };

  return (
    <HeaderWrapper>
      <div className="flex items-center h-full">
        <FiMenu
          size={18}
          className="mr-6 lg:hidden"
          onClick={() => setIsMenuOpen(true)}
        />
        {isMenuOpen && <SideBar isHeader handleClose={handleClose} />}
        <Link
          className="flex flex-col py-3"
          href={
            settings && settings.default_page === "chat" ? "/chat" : "/search"
          }
        >
          <div className="flex items-center justify-center w-full gap-3">
            <div className="flex items-center justify-center">
              <Image
                className="mx-auto"
                src={Logo}
                alt="arnold-ai-logo"
                width={40}
              />
            </div>
          </div>
        </Link>
        {/* <HeaderTitle>Arnold AI</HeaderTitle> */}
        {(!settings ||
          (settings.search_page_enabled && settings.chat_page_enabled)) && (
          <>
            <Link
              href="/search"
              className={"ml-6 h-full  flex-col hover:bg-hover lg:flex hidden"}
            >
              <div className="flex w-24 my-auto">
                <div className={"mx-auto flex text-strong px-2"}>
                  <FiSearch className="my-auto mr-1" />
                  <h1 className="flex my-auto text-sm font-bold">Search</h1>
                </div>
              </div>
            </Link>
            <Link
              href="/chat"
              className="flex-col hidden h-full hover:bg-hover lg:flex"
            >
              <div className="flex w-24 my-auto">
                <div className="flex px-2 mx-auto text-strong">
                  <FiMessageSquare className="my-auto mr-1" />
                  <h1 className="flex my-auto text-sm font-bold">Chat</h1>
                </div>
              </div>
            </Link>
          </>
        )}
        {/* 
        <div className="flex flex-col h-full ml-auto">
          <div className="my-auto">
            <UserDropdown user={user} hideChatAndSearch />
          </div>
        </div> */}
      </div>
    </HeaderWrapper>
  );
}
