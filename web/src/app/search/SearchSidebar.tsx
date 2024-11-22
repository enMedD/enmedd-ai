// "use client";

// import React from "react";
// import { Search, MessageCircleMore, Command } from "lucide-react";
// import { useContext } from "react";
// import Link from "next/link";
// import Image from "next/image";

// import EnmeddLogo from "../../../public/logo-brand.png";
// import { Separator } from "@/components/ui/separator";
// import { SettingsContext } from "@/components/settings/SettingsProvider";
// import { PageTab } from "@/components/PageTab";
// import { useSearchContext } from "@/context/SearchContext";
// import { ChatSession } from "../chat/interfaces";
// import { Logo } from "@/components/Logo";
// import ArnoldAi from "../../../public/arnold_ai.png";

// export const SearchSidebar = ({
//   isExpanded,
//   currentSearchSession,
//   openSidebar,
//   teamspaceId,
//   toggleSideBar,
// }: {
//   isExpanded?: boolean;
//   currentSearchSession?: ChatSession | null | undefined;
//   openSidebar?: boolean;
//   teamspaceId?: string;
//   toggleSideBar?: () => void;
// }) => {
//   const { querySessions } = useSearchContext();
//   const combinedSettings = useContext(SettingsContext);
//   if (!combinedSettings) {
//     return null;
//   }
//   const settings = combinedSettings.settings;
//   const workspaces = combinedSettings.workspaces;

//   const currentSearchId = currentSearchSession?.id;

//   return (
//     <>
//       <div
//         className={`
//             flex-col
//             h-full
//             flex
//             z-overlay
//             w-full py-4
//             `}
//         id="chat-sidebar"
//       >
//         <div className="flex items-center gap-2 w-full relative justify-center px-4 pb-4">
//           <div className="flex h-full items-center gap-1">
//             {workspaces && workspaces.use_custom_logo ? (
//               <Logo />
//             ) : (
//               <Image src={ArnoldAi} alt="arnoldai-logo" height={32} />
//             )}
//             <span className="text-lg font-semibold">
//               {workspaces && workspaces.workspace_name
//                 ? workspaces.workspace_name
//                 : "Arnold AI"}
//             </span>
//           </div>

//           {/* <Button
//             variant="ghost"
//             size="icon"
//             onClick={toggleSideBar}
//             className="lg:hidden"
//           >
//             <PanelLeftClose size={24} />
//           </Button> */}
//         </div>

//         <div className="h-full overflow-y-auto">
//           <div className="px-4 text-sm font-medium flex flex-col">
//             {settings.search_page_enabled && (
//               <>
//                 <Separator className="mb-4" />
//                 <Link
//                   href={teamspaceId ? `/t/${teamspaceId}/search` : "/search"}
//                   className={`flex px-4 py-2 h-10 rounded-regular cursor-pointer bg-brand-500 text-white items-center gap-2 justify-between`}
//                 >
//                   <div className="flex items-center gap-2">
//                     <Search size={16} className="shrink-0" />
//                     Search
//                   </div>
//                   <div className="flex items-center gap-1 font-normal">
//                     <Command size={14} />S
//                   </div>
//                 </Link>
//               </>
//             )}
//             {settings.chat_page_enabled && (
//               <>
//                 <Link
//                   href={teamspaceId ? `/t/${teamspaceId}/chat` : "/chat"}
//                   className={`flex px-4 py-2 h-10 rounded-regular cursor-pointer hover:bg-hover-light items-center gap-2 justify-between`}
//                 >
//                   <div className="flex items-center gap-2">
//                     <MessageCircleMore size={16} className="shrink-0" />
//                     Chat
//                   </div>

//                   <div className="flex items-center gap-1 font-normal">
//                     <Command size={14} />D
//                   </div>
//                 </Link>
//                 {/* {combinedSettings.featureFlags.explore_assistants && (
//                   <Link
//                     href="/assistants/mine"
//                     className="flex px-4 py-2 h-10 rounded-regular cursor-pointer hover:bg-hover-light items-center gap-2"
//                   >
//                     <Headset size={16} />
//                     <span className="truncate">Explore Assistants</span>
//                   </Link>
//                 )} */}
//               </>
//             )}
//             <Separator className="mt-4" />
//             <PageTab
//               existingChats={querySessions}
//               currentChatId={currentSearchId}
//               toggleSideBar={toggleSideBar}
//               teamspaceId={teamspaceId}
//               isSearch
//             />
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

"use client";

import React from "react";
import { useContext } from "react";
import Image from "next/image";

import { SettingsContext } from "@/components/settings/SettingsProvider";
import { useSearchContext } from "@/context/SearchContext";
import { ChatSession } from "../chat/interfaces";
import { Logo } from "@/components/Logo";
import ArnoldAi from "../../../public/arnold_ai.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Command, MessageCircleMore, Search } from "lucide-react";
import { PageTab } from "@/components/PageTab";
import { buildImgUrl } from "../chat/files/images/utils";

export const SearchSidebar = ({
  currentSearchSession,
  openSidebar,
  teamspaceId,
  toggleSideBar,
}: {
  currentSearchSession?: ChatSession | null | undefined;
  openSidebar?: boolean;
  teamspaceId?: string;
  toggleSideBar?: () => void;
}) => {
  const { querySessions } = useSearchContext();
  const combinedSettings = useContext(SettingsContext);
  if (!combinedSettings) {
    return null;
  }
  const settings = combinedSettings.settings;
  const workspaces = combinedSettings.workspaces;

  const currentSearchId = currentSearchSession?.id;

  return (
    <Sidebar collapsible="none" className="flex-1 flex">
      <SidebarHeader className="gap-3.5 border-b py-[17px] md:py-[9px] mx-3">
        {workspaces && workspaces.custom_header_logo ? (
          <img
            src={buildImgUrl(workspaces?.custom_header_logo)}
            alt="Logo"
            className="h-8 object-contain w-full"
          />
        ) : (
          <Image src={ArnoldAi} alt="arnoldai-logo" height={32} />
        )}
      </SidebarHeader>

      <SidebarContent className="mx-3 gap-0">
        <SidebarGroup className="border-b px-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="whitespace-nowrap shrink-0 truncate bg-brand-500 text-inverted hover:bg-brand-500">
                  <Link
                    href={teamspaceId ? `/t/${teamspaceId}/search` : "/search"}
                    className={`flex items-center gap-2 justify-between w-full`}
                  >
                    <div className="flex items-center gap-2">
                      <Search size={16} className="shrink-0" />
                      Search
                    </div>
                    <div className="flex items-center gap-1 font-normal">
                      <Command size={14} />S
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {settings.chat_page_enabled && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="whitespace-nowrap shrink-0 truncate">
                      <Link
                        href={teamspaceId ? `/t/${teamspaceId}/chat` : "/chat"}
                        className={`flex items-center gap-2 justify-between w-full`}
                      >
                        <div className="flex items-center gap-2">
                          <MessageCircleMore size={16} className="shrink-0" />
                          Chat
                        </div>

                        <div className="flex items-center gap-1 font-normal">
                          <Command size={14} />D
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* {combinedSettings.featureFlags.explore_assistants && (
                    <SidebarMenuItem>
                      <SidebarMenuButton className="whitespace-nowrap shrink-0 truncate">
                        <Link
                          href="/assistants/mine"
                          className={`flex items-center gap-2 justify-between w-full`}
                        >
                          <div className="flex items-center gap-2">
                            <Headset size={16} />
                            Explore Assistants
                          </div>

                          <div className="flex items-center gap-1 font-normal">
                            <Command size={14} />A
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )} */}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="border-b px-0">
          <SidebarGroupContent>
            {/* <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="whitespace-nowrap shrink-0 truncate bg-brand-500 text-inverted hover:bg-brand-500"></SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu> */}

            <PageTab
              existingChats={querySessions}
              currentChatId={currentSearchId}
              toggleSideBar={toggleSideBar}
              teamspaceId={teamspaceId}
              isSearch
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
