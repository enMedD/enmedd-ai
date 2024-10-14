"use client";

import {
  BookmarkIcon,
  ConnectorIcon,
  DatabaseIcon,
  GroupsIcon,
  KeyIcon,
  NotebookIcon,
  RobotIcon,
  ThumbsUpIcon,
  UsersIcon,
  ZoomInIcon,
} from "./icons/icons";
import { SERVER_SIDE_ONLY__PAID_ENTERPRISE_FEATURES_ENABLED } from "@/lib/constants";
import { AdminSidebar } from "./admin/connectors/AdminSidebar";
import {
  Cpu,
  Package,
  Settings,
  Shield,
  Wrench,
  Image as ImageIcon,
  Activity,
} from "lucide-react";
import { useContext } from "react";
import { SettingsContext } from "./settings/SettingsProvider";

interface SideBarProps {
  isTeamspace?: boolean;
}

export const SideBar: React.FC<SideBarProps> = ({ isTeamspace }) => {
  const dynamicSettings = useContext(SettingsContext);

  return (
    <div className="w-full h-full p-4 overflow-y-auto bg-background">
      <AdminSidebar
        collections={[
          {
            name: "Connectors",
            items: [
              {
                name: (
                  <div className="flex items-center gap-2">
                    <NotebookIcon size={20} />
                    <div>Existing Data Sources</div>
                  </div>
                ),
                link: "/admin/indexing/status",
              },
              {
                name: (
                  <div className="flex items-center gap-2">
                    <ConnectorIcon size={20} />
                    <div>Data Sources</div>
                  </div>
                ),
                link: "/admin/data-sources",
              },
            ],
          },
          {
            name: "Document Management",
            items: [
              {
                name: (
                  <div className="flex items-center gap-2">
                    <BookmarkIcon size={20} />
                    <div>Document Sets</div>
                  </div>
                ),
                link: "/admin/documents/sets",
              },
              {
                name: (
                  <div className="flex items-center gap-2">
                    <ZoomInIcon size={20} />
                    <div>Explorer</div>
                  </div>
                ),
                link: "/admin/documents/explorer",
              },
              {
                name: (
                  <div className="flex items-center gap-2">
                    <ThumbsUpIcon size={20} />
                    <div>Feedback</div>
                  </div>
                ),
                link: "/admin/documents/feedback",
              },
            ],
          },
          {
            name: "Custom Assistants",
            items: [
              {
                name: (
                  <div className="flex items-center gap-2">
                    <RobotIcon size={20} />
                    <div>Assistants</div>
                  </div>
                ),
                link: "/admin/assistants",
              },
              {
                name: (
                  <div className="flex items-center gap-2">
                    <Wrench size={20} className="my-auto" />
                    <div>Tools</div>
                  </div>
                ),
                link: "/admin/tools",
              },
            ],
          },
          {
            name: "Model Configs",
            items: [
              {
                name: (
                  <div className="flex items-center gap-2">
                    <Cpu size={20} />
                    <div>LLM</div>
                  </div>
                ),
                link: "/admin/models/llm",
              },
              {
                name: (
                  <div className="flex items-center gap-2">
                    <Package size={20} />
                    <div>Embedding</div>
                  </div>
                ),
                link: "/admin/models/embedding",
              },
            ],
          },
          {
            name: "User Management",
            items: [
              {
                name: (
                  <div className="flex items-center gap-2">
                    <UsersIcon size={20} />
                    <div>Users</div>
                  </div>
                ),
                link: "/admin/users",
              },

              ...(dynamicSettings?.featureFlags.multi_teamspace && !isTeamspace
                ? [
                    {
                      name: (
                        <div className="flex items-center gap-2">
                          <GroupsIcon size={20} />
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
                          <KeyIcon size={20} />
                          <div>API Keys</div>
                        </div>
                      ),
                      link: "/admin/api-key",
                    },
                    {
                      name: (
                        <div className="flex items-center gap-2">
                          <Shield size={20} />
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
                    <Activity size={20} />
                    <div>Usage Statistics</div>
                  </div>
                ),
                link: "/admin/performance/usage",
              },
              ...(dynamicSettings?.featureFlags.query_history
                ? [
                    {
                      name: (
                        <div className="flex items-center gap-2">
                          <DatabaseIcon size={20} />
                          <div>Query History</div>
                        </div>
                      ),
                      link: "/admin/performance/query-history",
                    },
                  ]
                : []),
              // {
              //   name: (
              //     <div className="flex items-center gap-2">
              //       <FiBarChart2 size={20} />
              //       <div >Custom Analytics</div>
              //     </div>
              //   ),
              //   link: "/admin/performance/custom-analytics",
              // },
            ],
          },
          {
            name: "Settings",
            items: [
              ...(isTeamspace
                ? [
                    {
                      name: (
                        <div className="flex items-center gap-2">
                          <Settings size={20} />
                          <div>Teamspace Settings</div>
                        </div>
                      ),
                      link: "/admin/settings",
                    },
                  ]
                : [
                    {
                      name: (
                        <div className="flex items-center gap-2">
                          <Settings size={20} />
                          <div>Workspace Settings</div>
                        </div>
                      ),
                      link: "/admin/settings",
                    },
                    ...(dynamicSettings?.featureFlags.whitelabelling
                      ? [
                          {
                            name: (
                              <div className="flex items-center gap-2">
                                <ImageIcon size={20} />
                                <div>Whitelabeling</div>
                              </div>
                            ),
                            link: "/admin/whitelabeling",
                          },
                        ]
                      : []),
                  ]),
            ],
          },
        ]}
      />
    </div>
  );
};
