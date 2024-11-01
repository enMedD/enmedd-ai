import { User } from "lucide-react";
import React from "react";
import { User as UserTypes } from "@/lib/types";
import { buildImgUrl } from "@/app/chat/files/images/utils";

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
  const colors = {
    primary: "#2039f3",
    primaryForeground: "#b8d7ff",
    success: "#69c57d",
  };
  const color1 =
    initials.charCodeAt(0) % 2 === 0 ? colors.primary : colors.success;
  const color2 =
    initials.charCodeAt(1) % 2 === 0
      ? colors.primaryForeground
      : colors.success;
  const color3 =
    initials.charCodeAt(2) % 2 === 0
      ? colors.primary
      : colors.primaryForeground;
  return `linear-gradient(to right, ${color1}, ${color2}, ${color3})`;
};

export function UserProfile({
  user,
  onClick,
  size = 40,
  textSize = "text-xl",
}: UserProfileProps) {
  const backgroundGradient =
    user && user.full_name
      ? generateGradient(getNameInitials(user.full_name))
      : "linear-gradient(to right, #e2e2e2, #ffffff)";

  return (
    <div
      className={`flex items-center justify-center rounded-full aspect-square shrink-0 ${textSize} font-medium text-inverted overflow-hidden`}
      style={{
        width: size,
        height: size,
        background: backgroundGradient,
      }}
      onClick={onClick}
    >
      {user?.profile ? (
        <img
          src={buildImgUrl(user.profile)}
          alt="User profile"
          className="w-full h-full object-cover rounded-full"
          width={size}
          height={size}
        />
      ) : user?.full_name ? (
        <span className={`${textSize} font-semibold`}>
          {getNameInitials(user.full_name)}
        </span>
      ) : (
        <User size={24} className="mx-auto" />
      )}
    </div>
  );
}
