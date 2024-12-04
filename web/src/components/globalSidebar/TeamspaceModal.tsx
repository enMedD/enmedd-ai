"use client";

import { Ellipsis } from "lucide-react";
import { CustomModal } from "../CustomModal";
import { useState } from "react";
import { MinimalTeamspaceSnapshot } from "@/lib/types";
import Link from "next/link";
import { buildImgUrl } from "@/app/chat/files/images/utils";
import { useGradient } from "@/hooks/useGradient";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";

interface TeamspaceModalProps {
  teamspace?: MinimalTeamspaceSnapshot[] | undefined;
  defaultPage: string;
  teamspaceId?: string | string[];
}

export const TeamspaceModal = ({
  teamspace,
  defaultPage,
  teamspaceId,
}: TeamspaceModalProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  if (!teamspace) return null;

  return (
    <CustomModal
      trigger={
        <SidebarMenuItem className="flex items-center justify-center">
          <SidebarMenuButton
            tooltip={{
              children: "More",
              hidden: false,
            }}
            onClick={() => setIsModalVisible(true)}
            className="w-11 h-11 hover:bg-light hover:text-accent-foreground focus-visible:ring-light flex items-center justify-center rounded-full"
          >
            <Ellipsis size={16} />
          </SidebarMenuButton>
        </SidebarMenuItem>
      }
      onClose={() => setIsModalVisible(false)}
      open={isModalVisible}
      title="Your Teamspace"
    >
      <div className="grid grid-cols-3 gap-4">
        {teamspace.map((team) => (
          <Link
            key={team.id}
            className={`flex items-center gap-4 border rounded-md p-4 cursor-pointer hover:bg-background-subtle transition-colors duration-200 ease-in-out ${Number(teamspaceId) === team.id ? "bg-brand-50" : ""}`}
            href={`/t/${team.id}/${defaultPage}`}
          >
            {team.logo ? (
              <div className="rounded-full w-11 h-11 bg-background overflow-hidden">
                <img
                  src={buildImgUrl(team.logo)}
                  alt="Teamspace Logo"
                  className="object-cover shrink-0 w-full h-full"
                  width={48}
                  height={48}
                />
              </div>
            ) : (
              <div
                style={{ background: useGradient(team.name) }}
                className="font-bold text-inverted w-11 h-11 shrink-0 rounded-full bg-brand-500 flex justify-center items-center uppercase"
              >
                {team.name.charAt(0)}
              </div>
            )}
            <h3 className="truncate">{team.name}</h3>
          </Link>
        ))}
      </div>
    </CustomModal>
  );
};
