"use client";

import { useContext, useEffect, useState } from "react";
import {
  Activity,
  Blocks,
  BookmarkIcon,
  CpuIcon,
  DatabaseIcon,
  FileSearch,
  FileText,
  KeyIcon,
  LibraryBigIcon,
  PlugZap,
  Settings,
  Shield,
  ThumbsUpIcon,
  UserIcon,
  Wrench,
  ZoomInIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SettingsContext } from "../settings/SettingsProvider";
import { useParams, usePathname } from "next/navigation";
import { GroupsIcon, RobotIcon } from "../icons/icons";
import { Logo } from "../Logo";
import Image from "next/image";
import ArnoldAi from "../../../public/arnold_ai.png";
import { buildImgUrl } from "@/app/chat/files/images/utils";

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  isTeamspace?: boolean;
}

interface SidebarItem {
  name: string | JSX.Element;
  link: string;
}

interface SidebarCollection {
  name: string;
  items: SidebarItem[];
}

export function AdminSidebar({ isTeamspace, ...props }: AdminSidebarProps) {
  const dynamicSettings = useContext(SettingsContext);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const { teamspaceId } = useParams();
  const pathname = usePathname();

  const sidebarCollections: SidebarCollection[] = [
    {
      name: "Connections",
      items: [
        {
          name: (
            <div className="flex items-center gap-2">
              <Blocks size={18} />
              <div>Existing Data Sources</div>
            </div>
          ),
          link: teamspaceId
            ? `/t/${teamspaceId}/admin/indexing/status`
            : `/admin/indexing/status`,
        },
        {
          name: (
            <div className="flex items-center gap-2">
              <PlugZap size={18} />
              <div>Connect Data Sources</div>
            </div>
          ),
          link: teamspaceId
            ? `/t/${teamspaceId}/admin/data-sources`
            : `/admin/data-sources`,
        },
      ],
    },
    {
      name: "Document Management",
      items: [
        {
          name: (
            <div className="flex items-center gap-2">
              <BookmarkIcon size={18} />
              <div>Document Sets</div>
            </div>
          ),
          link: teamspaceId
            ? `/t/${teamspaceId}/admin/documents/sets`
            : `/admin/documents/sets`,
        },
        {
          name: (
            <div className="flex items-center gap-2">
              <ZoomInIcon size={18} />
              <div>Explorer</div>
            </div>
          ),
          link: teamspaceId
            ? `/t/${teamspaceId}/admin/documents/explorer`
            : `/admin/documents/explorer`,
        },
        {
          name: (
            <div className="flex items-center gap-2">
              <ThumbsUpIcon size={18} />
              <div>Feedback</div>
            </div>
          ),
          link: teamspaceId
            ? `/t/${teamspaceId}/admin/documents/feedback`
            : `/admin/documents/feedback`,
        },
      ],
    },
    {
      name: "Custom Assistants",
      items: [
        {
          name: (
            <div className="flex items-center gap-2">
              <RobotIcon size={18} />
              <div>Assistants</div>
            </div>
          ),
          link: teamspaceId
            ? `/t/${teamspaceId}/admin/assistants`
            : `/admin/assistants`,
        },
        {
          name: (
            <div className="flex items-center gap-2">
              <Wrench size={18} className="my-auto" />
              <div>Tools</div>
            </div>
          ),
          link: teamspaceId ? `/t/${teamspaceId}/admin/tools` : `/admin/tools`,
        },
        ...(teamspaceId
          ? []
          : [
              {
                name: (
                  <div className="flex items-center gap-2">
                    <LibraryBigIcon className="my-auto" size={18} />
                    <div>Prompt Library</div>
                  </div>
                ),
                link: "/admin/prompt-library",
              },
            ]),
      ],
    },
    {
      name: "Configuration",
      items: teamspaceId
        ? []
        : [
            {
              name: (
                <div className="flex items-center gap-2">
                  <CpuIcon className="my-auto" size={18} />
                  <div>LLM</div>
                </div>
              ),
              link: "/admin/configuration/llm",
            },
            {
              name: (
                <div className="flex items-center gap-2">
                  <FileSearch className="my-auto" size={18} />
                  <div>Search Settings</div>
                </div>
              ),
              link: "/admin/configuration/search",
            },
            {
              name: (
                <div className="flex items-center gap-2">
                  <FileText className="my-auto" size={18} />
                  <div>Document Processing</div>
                </div>
              ),
              link: "/admin/configuration/document-processing",
            },
          ],
    },
    {
      name: "User Management",
      items: [
        {
          name: (
            <div className="flex items-center gap-2">
              <UserIcon size={18} />
              <div>Users</div>
            </div>
          ),
          link: teamspaceId ? `/t/${teamspaceId}/admin/users` : `/admin/users`,
        },
        ...(dynamicSettings?.featureFlags.multi_teamspace && !isTeamspace
          ? [
              {
                name: (
                  <div className="flex items-center gap-2">
                    <GroupsIcon size={18} />
                    <div>Teamspaces</div>
                  </div>
                ),
                link: "/admin/teams",
              },
            ]
          : []),
        ...(!isTeamspace
          ? [
              {
                name: (
                  <div className="flex items-center gap-2">
                    <KeyIcon size={18} />
                    <div>API Keys</div>
                  </div>
                ),
                link: "/admin/api-key",
              },
              {
                name: (
                  <div className="flex items-center gap-2">
                    <Shield size={18} />
                    <div>Token Rate Limits</div>
                  </div>
                ),
                link: "/admin/token-rate-limits",
              },
            ]
          : []),
      ],
    },
    {
      name: "Performance",
      items: [
        {
          name: (
            <div className="flex items-center gap-2">
              <Activity size={18} />
              <div>Usage Statistics</div>
            </div>
          ),
          link: teamspaceId
            ? `/t/${teamspaceId}/admin/performance/usage`
            : `/admin/performance/usage`,
        },
        ...(dynamicSettings?.featureFlags.query_history
          ? [
              {
                name: (
                  <div className="flex items-center gap-2">
                    <DatabaseIcon size={18} />
                    <div>Query History</div>
                  </div>
                ),
                link: teamspaceId
                  ? `/t/${teamspaceId}/admin/performance/query-history`
                  : `/admin/performance/query-history`,
              },
            ]
          : []),
      ],
    },
    {
      name: "Settings",
      items: [
        isTeamspace
          ? {
              name: (
                <div className="flex items-center gap-2">
                  <Settings size={18} />
                  <div>Teamspace Settings</div>
                </div>
              ),
              link: teamspaceId
                ? `/t/${teamspaceId}/admin/settings`
                : `/admin/settings`,
            }
          : {
              name: (
                <div className="flex items-center gap-2">
                  <Settings size={18} />
                  <div>Workspace Settings</div>
                </div>
              ),
              link: "/admin/settings",
            },
      ],
    },
  ];
  useEffect(() => {
    // Find the active item based on the current route
    const activeCollection = sidebarCollections.find((collection) =>
      collection.items.some((item) => item.link === pathname)
    );

    const activeMenuItem = activeCollection?.items.find(
      (item) => item.link === pathname
    );

    setActiveItem(activeMenuItem ? (activeMenuItem.name as string) : null);
  }, [pathname, sidebarCollections]);

  const combinedSettings = useContext(SettingsContext);
  if (!combinedSettings) {
    return null;
  }
  const workspaces = combinedSettings.workspaces;

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
      <SidebarContent className="gap-0">
        {sidebarCollections
          .filter((collection) => collection.items.length > 0)
          .map((collection, collectionIndex) => (
            <SidebarGroup key={collectionIndex}>
              <SidebarGroupContent>
                <SidebarGroupLabel>{collection.name}</SidebarGroupLabel>
                <SidebarMenu>
                  {collection.items.map((item, itemIndex) => (
                    <SidebarMenuItem key={itemIndex}>
                      {/* <div className="shrink-0 truncate flex w-full items-center gap-2 overflow-hidden rounded-sm p-2 text-left text-sm outline-none hover:bg-hover-light">
                        <a href={item.link}>{item.name}</a>
                      </div> */}
                      <SidebarMenuButton className="whitespace-nowrap shrink-0 truncate">
                        <a href={item.link}>{item.name}</a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
      </SidebarContent>
    </Sidebar>
  );
}
