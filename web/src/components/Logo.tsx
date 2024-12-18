"use client";

import { useContext } from "react";
import { SettingsContext } from "./settings/SettingsProvider";
import Image from "next/image";

export function Logo({
  height,
  width,
  className,
}: {
  height?: number;
  width?: number;
  className?: string;
}) {
  const settings = useContext(SettingsContext);

  height = height || 40;
  width = width || 40;

  if (!settings || !settings.workspaces || !settings.workspaces.custom_logo) {
    return (
      <div style={{ height, width }} className={className}>
        <Image
          src="/arnold_ai.png"
          alt="Logo"
          width={width}
          height={height}
          className="object-contain rounded-full"
        />
      </div>
    );
  }

  return (
    <div style={{ height, width }} className={`relative ${className}`}>
      <img
        src={"/api/workspace/logo?workspace_id=" + 0}
        alt="Logo"
        style={{ objectFit: "cover", height, width, borderRadius: "100%" }}
        width={width}
        height={height}
      />
    </div>
  );
}
