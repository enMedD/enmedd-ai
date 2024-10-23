import { ChangeEvent, FC, useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "./icons/icons";
import { Popover } from "./popover/Popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";

export interface Option<T> {
  name: string;
  value: T;
  description?: string;
  metadata?: { [key: string]: any };
}

export type StringOrNumberOption = Option<string | number>;

function StandardDropdownOption<T>({
  index,
  option,
  handleSelect,
}: {
  index: number;
  option: Option<T>;
  handleSelect: (option: Option<T>) => void;
}) {
  return (
    <button
      onClick={() => handleSelect(option)}
      className={`w-full text-left block px-4 py-2.5 text-sm hover:bg-gray-800 ${
        index !== 0 ? " border-t-2 border-gray-600" : ""
      }`}
      role="menuitem"
    >
      <p className="font-medium">{option.name}</p>
      {option.description && (
        <div>
          <p className="text-xs text-gray-300">{option.description}</p>
        </div>
      )}
    </button>
  );
}

export function SearchMultiSelectDropdown({
  options,
  onSelect,
  itemComponent,
}: {
  options: StringOrNumberOption[];
  onSelect: (selected: StringOrNumberOption) => void;
  itemComponent?: FC<{ option: StringOrNumberOption }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (option: StringOrNumberOption) => {
    onSelect(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div ref={dropdownRef} className="relative w-full">
          <Input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (!searchTerm) {
                setIsOpen(true);
              }
              if (!e.target.value) {
                setIsOpen(false);
              }
              setSearchTerm(e.target.value);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full"
          />
          <button
            type="button"
            className="absolute top-0 right-0 h-full px-2 text-sm border-border"
            onClick={() => setIsOpen(!isOpen)}
          >
            <ChevronDownIcon className="my-auto" />
          </button>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-full overflow-y-auto max-h-80 overscroll-contain"
        style={{ minWidth: dropdownRef.current?.offsetWidth }}
      >
        {filteredOptions.length ? (
          filteredOptions.map((option, index) =>
            itemComponent ? (
              <DropdownMenuItem
                key={option.name}
                onClick={() => {
                  setIsOpen(false);
                  handleSelect(option);
                }}
              >
                {itemComponent({ option })}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                key={index}
                onClick={() => handleSelect(option)}
              >
                {option.name}
              </DropdownMenuItem>
            )
          )
        ) : (
          <DropdownMenuItem disabled>No matches found...</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const CustomDropdown = ({
  children,
  dropdown,
  direction = "down", // Default to 'down' if not specified
}: {
  children: JSX.Element | string;
  dropdown: JSX.Element | string;
  direction?: "up" | "down";
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block w-full text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{children}</div>

      {isOpen && (
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute ${
            direction === "up" ? "bottom-full pb-2" : "pt-2 "
          } w-full z-30 box-shadow`}
        >
          {dropdown}
        </div>
      )}
    </div>
  );
};

export function DefaultDropdownElement({
  name,
  icon,
  description,
  onSelect,
  isSelected,
  includeCheckbox = false,
}: {
  name: string | JSX.Element;
  icon?: JSX.Element;
  description?: string;
  onSelect?: () => void;
  isSelected?: boolean;
  includeCheckbox?: boolean;
}) {
  return (
    <div
      className={`
        flex
        mx-1
        px-2
        text-sm 
        py-1.5 
        my-1
        select-none 
        cursor-pointer 
        bg-background
        rounded
        hover:bg-hover-light
      `}
      onClick={onSelect}
    >
      <div>
        <div className="flex">
          {includeCheckbox && (
            <input
              type="checkbox"
              className="mr-2"
              checked={isSelected}
              onChange={() => null}
            />
          )}
          {icon && icon}
          {name}
        </div>
        {description && <div className="text-xs">{description}</div>}
      </div>
      {isSelected && (
        <div className="my-auto ml-auto mr-1">
          <Check size={16} />
        </div>
      )}
    </div>
  );
}

export function DefaultDropdown({
  options,
  selected,
  onSelect,
  includeDefault = false,
  side,
  maxHeight,
}: {
  options: StringOrNumberOption[];
  selected: string | null;
  onSelect: (value: string | number | null) => void;
  includeDefault?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  maxHeight?: string;
}) {
  const selectedOption = options.find((option) => option.value === selected);
  const [isOpen, setIsOpen] = useState(false);

  const Content = (
    <div
      className={`
      flex 
      text-sm 
      bg-background 
      px-3
      py-1.5 
      rounded-regular 
      border 
      border-border 
      cursor-pointer`}
    >
      <p className="line-clamp-1">
        {selectedOption?.name ||
          (includeDefault ? "Default" : "Select an option...")}
      </p>
      <ChevronDown className="my-auto ml-auto" size={16} />
    </div>
  );

  const Dropdown = (
    <div
      className={`
        border 
        rounded-regular 
        flex 
        flex-col 
        bg-background
        ${maxHeight || "max-h-96"}
        overflow-y-auto 
        overscroll-contain`}
    >
      {includeDefault && (
        <DefaultDropdownElement
          key={-1}
          name="Default"
          onSelect={() => {
            onSelect(null);
          }}
          isSelected={selected === null}
        />
      )}
      {options.map((option, ind) => {
        const isSelected = option.value === selected;
        return (
          <DefaultDropdownElement
            key={option.value}
            name={option.name}
            description={option.description}
            onSelect={() => onSelect(option.value)}
            isSelected={isSelected}
          />
        );
      })}
    </div>
  );

  return (
    <div onClick={() => setIsOpen(!isOpen)}>
      <Popover
        open={isOpen}
        onOpenChange={(open) => setIsOpen(open)}
        content={Content}
        popover={Dropdown}
        align="start"
        side={side}
        sideOffset={5}
        matchWidth
        triggerMaxWidth
      />
    </div>
  );
}

export function ControlledPopup({
  children,
  popupContent,
  isOpen,
  setIsOpen,
}: {
  children: JSX.Element | string;
  popupContent: JSX.Element | string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const filtersRef = useRef<HTMLDivElement>(null);
  // hides logout popup on any click outside
  const handleClickOutside = (event: MouseEvent) => {
    if (
      filtersRef.current &&
      !filtersRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={filtersRef} className="relative">
      {children}
      {isOpen && (
        <div
          className={`
            absolute 
            top-0 
            bg-background 
            border 
            border-border 
            z-30 
            rounded 
             
            shadow-lg`}
          style={{ transform: "translateY(calc(-100% - 5px))" }}
        >
          {popupContent}
        </div>
      )}
    </div>
  );
}
