export function BasicClickable({
  children,
  onClick,
  fullWidth = false,
  inset,
}: {
  children: string | JSX.Element;
  onClick?: () => void;
  inset?: boolean;
  fullWidth?: boolean;
  isExpanded?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`transition-all ease-in-out duration-300 h-full w-full shadow-sm rounded-regular bg-background p-3  ${fullWidth ? "w-full" : ""}`}
    >
      {children}
    </div>
  );
}

export function EmphasizedClickable({
  children,
  onClick,
  fullWidth = false,
  size = "md",
}: {
  children: string | JSX.Element;
  onClick?: () => void;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      onClick={onClick}
      className={`
          border 
          border-gray-400
          shadow-md
          rounded-regular
          p-1
          select-none
          bg-hover-light
          hover:bg-hover
          text-sm
          ${fullWidth ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

export function BasicSelectable({
  children,
  selected,
  hasBorder,
  fullWidth = false,
  padding = "normal",
}: {
  children: string | JSX.Element;
  selected: boolean;
  hasBorder?: boolean;
  fullWidth?: boolean;
  padding?: "none" | "normal" | "extra";
}) {
  return (
    <div
      className={`
          rounded-regular
          text-sm
          ${padding && "px-4 py-2"}
          select-none
          flex items-center
          h-10
          ${hasBorder ? "border border-border" : ""}
          ${selected ? "bg-hover" : "hover:bg-hover-light"} 
          ${fullWidth ? "w-full" : ""}`}
    >
      {children}
    </div>
  );
}
