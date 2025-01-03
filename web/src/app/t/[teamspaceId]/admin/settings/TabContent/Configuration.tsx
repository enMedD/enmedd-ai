"use client";

import { SubLabel } from "@/components/admin/connectors/Field";
import { useParams } from "next/navigation";
import { Option } from "@/components/Dropdown";
import React, { useState, useEffect } from "react";
import { usePaidEnterpriseFeaturesEnabled } from "@/components/settings/usePaidEnterpriseFeaturesEnabled";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label as ShadcnLabel } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

function CheckboxComponent({
  label,
  sublabel,
  checked,
  onChange,
}: {
  label: string;
  sublabel: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex text-sm mb-8 gap-3">
      <Checkbox checked={checked} onCheckedChange={onChange} id={label} />
      <div className="grid leading-none gap-2">
        <ShadcnLabel
          htmlFor={label}
          className="text-base font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </ShadcnLabel>
        <p className="text-sm text-muted-foreground">{sublabel}</p>
      </div>
    </div>
  );
}

function Selector({
  label,
  subtext,
  options,
  selected,
  onSelect,
}: {
  label: string;
  subtext: string;
  options: Option<string>[];
  selected: string;
  onSelect: (value: string | number | null) => void;
}) {
  return (
    <div>
      <div className="grid gap-1 pb-1.5">
        {label && (
          <ShadcnLabel
            htmlFor={label}
            className="text-base font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </ShadcnLabel>
        )}
        {subtext && <p className="text-sm text-muted-foreground">{subtext}</p>}
      </div>

      <div className="w-full max-w-96">
        <Select value={selected} onValueChange={onSelect}>
          <SelectTrigger className="flex text-sm bg-background px-3 py-1.5 rounded-regular border border-border cursor-pointer">
            <SelectValue
              placeholder={selected ? undefined : "Select an option..."}
            />
          </SelectTrigger>
          <SelectContent className="flex flex-col overflow-y-auto border rounded-regular bg-background max-h-96 overscroll-contain">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function Configuration() {
  const { teamspaceId } = useParams();
  const { toast } = useToast();
  const [chatPageEnabled, setChatPageEnabled] = useState<boolean>(true);
  const [searchPageEnabled, setSearchPageEnabled] = useState<boolean>(true);
  const [chatHistoryEnabled, setChatHistoryEnabled] = useState<boolean>(true);
  const [defaultPage, setDefaultPage] = useState<string>("chat");
  const [chatRetention, setChatRetention] = useState<string | null>(null);
  const [initialSettings, setInitialSettings] = useState<any>(null); // Track initial settings

  const isEnterpriseEnabled = usePaidEnterpriseFeaturesEnabled();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(
          `/api/settings?teamspace_id=${teamspaceId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }
        const settings = await response.json();
        setChatPageEnabled(settings.chat_page_enabled);
        setSearchPageEnabled(settings.search_page_enabled);
        setChatHistoryEnabled(settings.chat_history_enabled);
        setDefaultPage(settings.default_page);
        setChatRetention(
          settings.maximum_chat_retention_days?.toString() || null
        );

        setInitialSettings(settings);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "Error",
          description: `Error fetching settings: ${error}`,
          variant: "destructive",
        });
      }
    };

    fetchSettings();
  }, [teamspaceId]);

  const handleCheckboxChange =
    (
      setter: React.Dispatch<React.SetStateAction<boolean>>,
      fieldName: string
    ) =>
    (checked: boolean) => {
      if (
        !checked &&
        ((fieldName === "search_page_enabled" && !chatPageEnabled) ||
          (fieldName === "chat_page_enabled" && !searchPageEnabled))
      ) {
        toast({
          title: "Error",
          description:
            "You cannot disable both Chat and Search page visibility.",
          variant: "destructive",
        });
        return;
      }

      setter(checked);

      if (
        !checked &&
        (fieldName === "search_page_enabled" ||
          fieldName === "chat_page_enabled")
      ) {
        const isSearchField = fieldName === "search_page_enabled";
        const otherPageEnabled = isSearchField
          ? chatPageEnabled
          : searchPageEnabled;

        if (
          otherPageEnabled &&
          defaultPage === (isSearchField ? "search" : "chat")
        ) {
          const newDefaultPage = isSearchField ? "chat" : "search";
          setDefaultPage(newDefaultPage);
        }
      }
    };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (defaultPage === "chat" && !chatPageEnabled) {
      toast({
        title: "Error",
        description:
          "The default page cannot be 'chat' if the chat page is disabled.",
        variant: "destructive",
      });
      return;
    }

    if (defaultPage === "search" && !searchPageEnabled) {
      toast({
        title: "Error",
        description:
          "The default page cannot be 'search' if the search page is disabled.",
        variant: "destructive",
      });
      return;
    }

    const settings = {
      chat_page_enabled: chatPageEnabled,
      search_page_enabled: searchPageEnabled,
      chat_history_enabled: chatHistoryEnabled,
      default_page: defaultPage,
      maximum_chat_retention_days: chatRetention,
    };

    try {
      const response = await fetch(
        `/api/admin/settings?teamspace_id=${teamspaceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: "Settings updated successfully!",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (initialSettings) {
      setChatPageEnabled(initialSettings.chat_page_enabled);
      setSearchPageEnabled(initialSettings.search_page_enabled);
      setChatHistoryEnabled(initialSettings.chat_history_enabled);
      setDefaultPage(initialSettings.default_page);
      setChatRetention(
        initialSettings.maximum_chat_retention_days?.toString() || null
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      <div className="pt-8">
        <h2 className="font-bold text:lg md:text-xl">Page and Chat Setup</h2>
        <p className="text-sm">
          Manage general Arnold AI settings applicable to all users in the
          teamspace.
        </p>
      </div>

      <div>
        <h3 className="pb-8">Page Visibility</h3>
        <CheckboxComponent
          label="Chat Page Enabled?"
          sublabel="If set, then the 'Chat' page will be accessible to all users and will show up as an option on the top navbar. If unset, then this page will not be available."
          checked={chatPageEnabled}
          onChange={handleCheckboxChange(
            setChatPageEnabled,
            "chat_page_enabled"
          )}
        />
        <CheckboxComponent
          label="Search Page Enabled?"
          sublabel="If set, then the 'Search' page will be accessible to all users and will show up as an option on the top navbar. If unset, then this page will not be available."
          checked={searchPageEnabled}
          onChange={handleCheckboxChange(
            setSearchPageEnabled,
            "search_page_enabled"
          )}
        />
      </div>

      <Selector
        label="Default Page"
        subtext="Select the default page to display."
        options={[
          { value: "chat", name: "Chat" },
          { value: "search", name: "Search" },
        ]}
        selected={defaultPage}
        onSelect={(value) => setDefaultPage(value as string)}
      />

      {isEnterpriseEnabled && (
        <div>
          <div className="mb-1.5">
            <h3>Chat Retention</h3>
            <SubLabel>
              Enter the maximum number of days you would like Arnold AI to
              retain chat messages. Leaving this field empty will cause Arnold
              AI to never delete chat messages.
            </SubLabel>
          </div>
          <Input
            type="number"
            className="w-full max-w-xs"
            value={chatRetention === "" ? "" : (Number(chatRetention) ?? "")}
            onChange={(e) => {
              const value = e.target.value;
              setChatRetention(value === "" ? null : value);
            }}
            min="1"
            step="1"
            id="chatRetentionInput"
            placeholder="Infinite Retention"
          />
        </div>
      )}

      <div className="mt-8">
        <h3>Query History</h3>
        <p className="text-sm">
          Allows users to track and review their past searches and responses
          within the platform.
        </p>

        <div className="flex items-center gap-4 pt-4">
          <Switch
            checked={chatHistoryEnabled}
            onCheckedChange={handleCheckboxChange(
              setChatHistoryEnabled,
              "chat_history_enabled"
            )}
          />
          <p className="text-sm">
            Query History allows users to conduct searches and activities
            without them being recorded in the query history. When enabled,
            these activities remain hidden from both the workspace and admin
            logs, ensuring privacy and discretion for the user.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 py-8 border-t">
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="submit">Update Settings</Button>
      </div>
    </form>
  );
}
