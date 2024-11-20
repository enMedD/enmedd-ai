import React from "react";
import { User as UserTypes } from "@/lib/types";
import { buildImgUrl } from "@/app/chat/files/images/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

import config from "../../tailwind-themes/tailwind.config";
import { User } from "lucide-react";
const tailwindColors = config.theme.extend.colors;

interface UserProfileProps {
  user?: UserTypes | null;
  onClick?: () => void;
  size?: number;
  textSize?: string;
  isShared?: boolean;
}

const getNameInitials = (fullName: string) => {
  const names = fullName.split(" ");
  return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
};

const generateGradient = (teamspaceName: string) => {
  const colors = [
    tailwindColors.brand[100],
    tailwindColors.brand[200],
    tailwindColors.brand[300],
    tailwindColors.brand[400],
    tailwindColors.brand[500],
  ];
  const index = teamspaceName.charCodeAt(0) % colors.length;
  return `linear-gradient(135deg, ${colors[index]}, ${colors[(index + 1) % colors.length]})`;
};

export function UserProfile({
  user,
  onClick,
  size = 40,
  textSize = "text-base",
  isShared,
}: UserProfileProps) {
  const backgroundGradient =
    user && user.full_name
      ? generateGradient(getNameInitials(user.full_name))
      : "linear-gradient(to right, #e2e2e2, #ffffff)";

  return (
    <Avatar
      onClick={onClick}
      style={{
        width: size,
        height: size,
      }}
    >
      {user && user.profile ? (
        <AvatarImage
          src={buildImgUrl(user.profile)}
          alt={user.full_name || "User"}
        />
      ) : (
        <AvatarFallback
          className={`text-inverted font-medium ${textSize}`}
          style={{
            background: backgroundGradient,
          }}
        >
          {user ? (
            getNameInitials(user.full_name || "")
          ) : isShared ? (
            <User />
          ) : (
            ""
          )}
        </AvatarFallback>
      )}
    </Avatar>
  );
}
