import React from "react";
import { User as UserTypes } from "@/lib/types";
import { buildImgUrl } from "@/app/chat/files/images/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface UserProfileProps {
  user?: UserTypes | null;
  onClick?: () => void;
  size?: number;
  textSize?: string;
}

const getNameInitials = (fullName: string) => {
  const names = fullName.split(" ");
  return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
};

const generateGradient = (initials: string) => {
  const color1 = "#666666";
  const color2 = "#333333";
  const color3 = "#000000";
  return `linear-gradient(to right, ${color1}, ${color2}, ${color3})`;
};

export function UserProfile({
  user,
  onClick,
  size = 40,
  textSize = "text-base",
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
          {user ? getNameInitials(user.full_name || "") : ""}
        </AvatarFallback>
      )}
    </Avatar>
  );
}
