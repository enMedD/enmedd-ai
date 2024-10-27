import { createContext, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

// Create a context for the tooltip group
const TooltipGroupContext = createContext<{
  setGroupHovered: React.Dispatch<React.SetStateAction<boolean>>;
  groupHovered: boolean;
  hoverCountRef: React.MutableRefObject<boolean>;
}>({
  setGroupHovered: () => {},
  groupHovered: false,
  hoverCountRef: { current: false },
});

export const TooltipGroup: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [groupHovered, setGroupHovered] = useState(false);
  const hoverCountRef = useRef(false);

  return (
    <TooltipGroupContext.Provider
      value={{ groupHovered, setGroupHovered, hoverCountRef }}
    >
      <div className="inline-flex">{children}</div>
    </TooltipGroupContext.Provider>
  );
};

export function CustomTooltip({
  children,
  trigger,
  align = "center",
  side = "top",
  delayDuration = 300,
  style,
  asChild,
}: {
  children: React.ReactNode;
  trigger: string | React.ReactNode;
  align?: "start" | "end" | "center";
  side?: "right" | "bottom" | "left" | "top";
  delayDuration?: number;
  style?: string;
  asChild?: boolean;
}) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={delayDuration}>
        <TooltipTrigger asChild={asChild}>{trigger}</TooltipTrigger>
        <TooltipContent
          align={align}
          side={side}
          className={`!z-modal ${style} bg-primary border-none text-inverted`}
        >
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
