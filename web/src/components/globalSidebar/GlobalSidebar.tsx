// "use client";

// import ArnoldAi from "../../../public/arnold_ai.png";
// import { Separator } from "@/components/ui/separator";
// import { User } from "@/lib/types";
// import { CustomTooltip } from "@/components/CustomTooltip";
// import { Logo } from "@/components/Logo";
// import { useContext } from "react";
// import { SettingsContext } from "@/components/settings/SettingsProvider";
// import Link from "next/link";
// import { TeamspaceBubble } from "@/components/TeamspaceBubble";
// import Image from "next/image";
// import { TeamspaceModal } from "./TeamspaceModal";
// import { useParams, useRouter } from "next/navigation";
// import { UserSettingsButton } from "../UserSettingsButton";

// interface GlobalSidebarProps {
//   openSidebar?: boolean;
//   user?: User | null;
// }

// export const GlobalSidebar = ({ openSidebar, user }: GlobalSidebarProps) => {
//   const { teamspaceId } = useParams();
//   const combinedSettings = useContext(SettingsContext);
//   if (!combinedSettings) {
//     return null;
//   }
//   const settings = combinedSettings.settings;
//   const workspaces = combinedSettings.workspaces;
//   const defaultPage = settings.default_page;

//   let teamsapces = user?.groups || [];
//   if (teamspaceId) {
//     const matchingTeamspace = teamsapces.find(
//       (group) => group.id.toString() === teamspaceId
//     );
//     const otherTeamspaces = teamsapces.filter(
//       (group) => group.id.toString() !== teamspaceId
//     );
//     teamsapces = matchingTeamspace
//       ? [matchingTeamspace, ...otherTeamspaces]
//       : otherTeamspaces;
//   }
//   const displayedTeamspaces = teamsapces.slice(0, 8);
//   const showEllipsis = user?.groups && user.groups.length > 8;

//   return (
//     <div className={`bg-background h-full p-4 border-r border-border z-10`}>
//       <div
//         className={`h-full flex flex-col justify-between transition-opacity duration-300 ease-in-out lg:!opacity-100  ${
//           openSidebar ? "opacity-100 delay-200" : "opacity-0 delay-100"
//         }`}
//       >
//         <div className="flex flex-col items-center h-full overflow-y-auto">
//           <Image
//             src={ArnoldAi}
//             alt="Arnold AI Logo"
//             width={40}
//             height={40}
//             className="rounded-regular shrink-0"
//           />
//           <Separator className="mt-4" />
//           <div className="flex flex-col items-center gap-4 pt-4">
//             <CustomTooltip
//               trigger={
//                 <Link href={`/${defaultPage}`} className="flex items-center">
//                   {workspaces?.use_custom_logo ? (
//                     <Logo />
//                   ) : (
//                     <Image
//                       src={ArnoldAi}
//                       alt="Arnold AI Logo"
//                       width={40}
//                       height={40}
//                     />
//                   )}
//                 </Link>
//               }
//               side="right"
//               delayDuration={0}
//               asChild
//             >
//               {workspaces?.workspace_name
//                 ? workspaces.workspace_name
//                 : "Arnold AI"}
//             </CustomTooltip>
//           </div>
//           <Separator className="mt-4" />
//           {user?.groups && (
//             <div className="flex flex-col items-center gap-3 pt-4">
//               {displayedTeamspaces?.map((teamspace) => (
//                 <TeamspaceBubble
//                   key={teamspace.id}
//                   teamspace={teamspace}
//                   link={`t/${teamspace.id}/${defaultPage}`}
//                   teamspaceId={teamspaceId}
//                 />
//               ))}
//               {showEllipsis && (
//                 <TeamspaceModal
//                   teamspace={teamsapces}
//                   defaultPage={defaultPage}
//                   teamspaceId={teamspaceId}
//                 />
//               )}
//             </div>
//           )}
//         </div>
//         <div className="flex flex-col items-center gap-4 mt-5">
//           <UserSettingsButton defaultPage={defaultPage} />
//         </div>
//       </div>
//     </div>
//   );
// };

"use client";

import { useContext } from "react";
import ArnoldAi from "../../../public/arnold_ai.png";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserSettingsButton } from "../UserSettingsButton";
import Image from "next/image";
import { CustomTooltip } from "../CustomTooltip";
import Link from "next/link";
import { Logo } from "../Logo";
import { SettingsContext } from "../settings/SettingsProvider";
import { useParams } from "next/navigation";
import { User } from "@/lib/types";
import { buildImgUrl } from "@/app/chat/files/images/utils";
import { Ellipsis } from "lucide-react";

export function GlobalSidebar({
  user,
  children,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: User | null;
  children?: React.ReactNode;
}) {
  const { teamspaceId } = useParams();
  const { setOpen } = useSidebar();
  const combinedSettings = useContext(SettingsContext);
  if (!combinedSettings) {
    return null;
  }
  const settings = combinedSettings.settings;
  const workspaces = combinedSettings.workspaces;
  const defaultPage = settings.default_page;

  let teamsapces = user?.groups || [];
  if (teamspaceId) {
    const matchingTeamspace = teamsapces.find(
      (group) => group.id.toString() === teamspaceId
    );
    const otherTeamspaces = teamsapces.filter(
      (group) => group.id.toString() !== teamspaceId
    );
    teamsapces = matchingTeamspace
      ? [matchingTeamspace, ...otherTeamspaces]
      : otherTeamspaces;
  }
  const displayedTeamspaces = teamsapces.slice(0, 8);
  const showEllipsis = user?.groups && user.groups.length > 8;

  const generateGradient = (teamspaceName: string) => {
    const colors = ["#CCCCCC", "#999999", "#666666", "#333333", "#000000"];
    const index = teamspaceName.charCodeAt(0) % colors.length;
    return `linear-gradient(135deg, ${colors[index]}, ${colors[(index + 1) % colors.length]})`;
  };

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r"
      >
        <SidebarHeader className="">
          <SidebarMenu>
            <SidebarGroupContent className="space-y-2.5">
              <SidebarMenuItem className="border-b pb-2.5">
                <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                  <a href="#">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <Image
                        src={ArnoldAi}
                        alt="Arnold AI Logo"
                        width={32}
                        height={32}
                        className="rounded-regular shrink-0"
                      />
                    </div>
                    {/* <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">Acme Inc</span>
                      <span className="truncate text-xs">Enterprise</span>
                    </div> */}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className="border-b pb-2.5">
                <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                  <CustomTooltip
                    trigger={
                      <Link
                        href={`/${defaultPage}`}
                        className="flex items-center justify-center"
                      >
                        {workspaces?.use_custom_logo ? (
                          <Logo />
                        ) : (
                          <Image
                            src={ArnoldAi}
                            alt="Arnold AI Logo"
                            width={32}
                            height={32}
                          />
                        )}
                      </Link>
                    }
                    side="right"
                    delayDuration={0}
                    asChild
                  >
                    {workspaces?.workspace_name
                      ? workspaces.workspace_name
                      : "Arnold AI"}
                  </CustomTooltip>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarGroupContent>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu className="space-y-1">
                {displayedTeamspaces.map((teamspace) => (
                  <SidebarMenuItem key={teamspace.id}>
                    <SidebarMenuButton
                      tooltip={{
                        children: teamspace.name,
                        hidden: false,
                      }}
                      className={`!p-0 h-8 ${Number(teamspaceId) === teamspace.id ? "bg-secondary-500" : ""}`}
                      isActive={teamspace.id.toString() === teamspaceId}
                    >
                      <Link
                        href={`/t/${teamspace.id}/${defaultPage}`}
                        className="w-full h-full flex items-center justify-center"
                      >
                        {teamspace.logo ? (
                          <img
                            src={buildImgUrl(teamspace.logo)}
                            alt="Teamspace Logo"
                            // className={`object-cover shrink-0 ${Number(teamspaceId) === teamspace.id ? "w-7 h-7 rounded-[8px]" : "w-full h-full"}`}
                            className={`object-cover shrink-0 ${Number(teamspaceId) === teamspace.id ? "h-7 w-7 rounded-sm" : "w-9 h-full"}`}
                            width={28}
                            height={28}
                          />
                        ) : (
                          <div
                            style={{
                              background: generateGradient(teamspace.name),
                            }}
                            // className={`font-bold text-inverted shrink-0  bg-brand-500 flex justify-center items-center uppercase ${Number(teamspaceId) === teamspace.id ? "w-7 h-7 rounded-[8px]" : "w-full h-full"}`}
                            className={`font-bold text-inverted shrink-0  bg-brand-500 flex justify-center items-center uppercase ${Number(teamspaceId) === teamspace.id ? "h-7 w-8 rounded-sm" : "w-full h-full"}`}
                          >
                            {teamspace.name.charAt(0)}
                          </div>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                {!showEllipsis && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip={{
                        children: "More",
                        hidden: false,
                      }}
                      className="p-0 h-8 hover:bg-light hover:text-accent-foreground focus-visible:ring-light flex items-center justify-center"
                    >
                      <Ellipsis size={16} />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <UserSettingsButton />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}

      {children}
    </Sidebar>
  );
}
