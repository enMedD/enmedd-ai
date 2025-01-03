"use client";

import "./styles.css";

import * as RadixPopover from "@radix-ui/react-popover";

export function Popover({
  open,
  onOpenChange,
  content,
  popover,
  side,
  align,
  sideOffset,
  alignOffset,
  matchWidth,
  requiresContentPadding,
  triggerMaxWidth,
  asChild,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: JSX.Element;
  popover: JSX.Element;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  matchWidth?: boolean;
  requiresContentPadding?: boolean;
  triggerMaxWidth?: boolean;
  asChild?: boolean;
}) {
  /* 
  This Popover is needed when we want to put a popup / dropdown in a component
  with `overflow-hidden`. This is because the Radix Popover uses `absolute` positioning
  outside of the component's container.
  */
  if (!open) {
    return content;
  }

  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      <RadixPopover.Trigger style={triggerMaxWidth ? { width: "100%" } : {}}>
        {/* NOTE: this weird `-mb-1.5` is needed to offset the Anchor, otherwise 
          the content will shift up by 1.5px when the Popover is open. */}
        {content}
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          className={
            "PopoverContent z-popout " +
            (matchWidth ? " PopoverContentMatchWidth" : "")
          }
          asChild={asChild}
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
        >
          {popover}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
