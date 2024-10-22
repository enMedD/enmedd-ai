import React, { useState } from "react";
import { DocumentSet, Tag, ValidSources } from "@/lib/types";
import { SourceMetadata } from "@/lib/search/interfaces";
import { listSourceMetadata } from "@/lib/sources";
import { SourceIcon } from "@/components/SourceIcon";
import { TagFilter } from "./TagFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Book, Bookmark, Brain, Map, X } from "lucide-react";
import { CustomTooltip } from "@/components/CustomTooltip";
import { DateRangeSearchSelector } from "../DateRangeSearchSelector";
import { Button } from "@/components/ui/button";

const SectionTitle = ({ children }: { children: string }) => (
  <div className="flex px-5 py-3 text-sm font-bold">{children}</div>
);

import { DateRange as BaseDateRange } from "react-day-picker";
import { FiBook, FiMap, FiTag } from "react-icons/fi";
import { FilterDropdown } from "./FilterDropdown";

interface CustomDateRange extends BaseDateRange {
  selectValue?: string;
}

export interface SourceSelectorProps {
  timeRange: CustomDateRange | null;
  setTimeRange: React.Dispatch<React.SetStateAction<CustomDateRange | null>>;
  selectedSources: SourceMetadata[];
  setSelectedSources: React.Dispatch<React.SetStateAction<SourceMetadata[]>>;
  selectedDocumentSets: string[];
  setSelectedDocumentSets: React.Dispatch<React.SetStateAction<string[]>>;
  selectedTags: Tag[];
  setSelectedTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  availableDocumentSets: DocumentSet[];
  existingSources: ValidSources[];
  availableTags: Tag[];
}

export function SourceSelector({
  timeRange,
  setTimeRange,
  selectedSources,
  setSelectedSources,
  selectedDocumentSets,
  setSelectedDocumentSets,
  selectedTags,
  setSelectedTags,
  availableDocumentSets,
  existingSources,
  availableTags,
}: SourceSelectorProps) {
  const handleSelect = (source: SourceMetadata) => {
    setSelectedSources((prev: SourceMetadata[]) => {
      if (
        prev.map((source) => source.internalName).includes(source.internalName)
      ) {
        return prev.filter((s) => s.internalName !== source.internalName);
      } else {
        return [...prev, source];
      }
    });
  };

  const handleDocumentSetSelect = (documentSetName: string) => {
    setSelectedDocumentSets((prev: string[]) => {
      if (prev.includes(documentSetName)) {
        return prev.filter((s) => s !== documentSetName);
      } else {
        return [...prev, documentSetName];
      }
    });
  };

  let allSourcesSelected = selectedSources.length > 0;

  const toggleAllSources = () => {
    if (allSourcesSelected) {
      setSelectedSources([]);
    } else {
      const allSources = listSourceMetadata().filter((source) =>
        existingSources.includes(source.internalName)
      );
      setSelectedSources(allSources);
    }
  };

  return (
    <div className="w-full flex flex-col lg:gap-4 text-dark-900">
      <div className="lg:hidden">
        <div className="w-full p-2.5">
          <span className="flex p-2 text-sm font-bold">Sort by</span>
          <div className="flex gap-2 flex-wrap">
            <Button>Last Accessed</Button>
            <Button variant="secondary">Tags/Labels</Button>
            <Button variant="secondary">Relevance</Button>
          </div>
        </div>

        <div className="w-full p-2.5">
          <span className="flex p-2 text-sm font-bold">Date</span>
          <div className="flex gap-2 flex-wrap">
            <Button>Today</Button>
            <Button variant="secondary">Last 7 days</Button>
            <Button variant="secondary">Last 30 days</Button>
          </div>
        </div>
      </div>

      {existingSources.length > 0 && (
        <div className="lg:border rounded-[8px] w-full">
          <SectionTitle>Sources</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-0 px-3 max-h-96 overflow-y-auto">
            {listSourceMetadata()
              .filter((source) => existingSources.includes(source.internalName))
              .map((source, index, array) => (
                <div
                  key={source.internalName}
                  className={`w-full flex items-center justify-between cursor-pointer gap-2 ${
                    index === 0 ? "lg:border-t" : ""
                  } ${index !== array.length - 1 ? "lg:border-b" : ""}`}
                  onClick={() => handleSelect(source)}
                >
                  <label
                    htmlFor={source.internalName}
                    className="flex items-center w-full px-2 py-3"
                  >
                    <SourceIcon
                      sourceType={source.internalName}
                      iconSize={18}
                    />
                    <span className="ml-3 text-sm">{source.displayName}</span>
                  </label>
                  <Checkbox id={source.internalName} />
                </div>
              ))}
          </div>
        </div>
      )}

      {availableDocumentSets.length > 0 && (
        <div className="lg:border rounded-[8px] w-full">
          <SectionTitle>Knowledge Sets</SectionTitle>
          <div className="px-3 max-h-80 overflow-y-auto">
            {availableDocumentSets
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((documentSet) => (
                <div
                  key={documentSet.name}
                  className="w-full flex items-center justify-between cursor-pointer gap-2 border-t"
                >
                  <label
                    htmlFor={documentSet.name}
                    className="flex items-center w-full px-2 py-3"
                    onClick={() => handleDocumentSetSelect(documentSet.name)}
                  >
                    <CustomTooltip
                      trigger={
                        <div className="flex my-auto mr-3">
                          <Brain size={18} />
                        </div>
                      }
                    >
                      <div className="text-sm">
                        <div className="flex font-medium">Description</div>
                        <div className="mt-1">{documentSet.description}</div>
                      </div>
                    </CustomTooltip>
                    <span className="text-sm">{documentSet.name}</span>
                  </label>
                  <Checkbox id={documentSet.name} />
                </div>
              ))}
          </div>
        </div>
      )}

      {availableTags.length > 0 && (
        <div className="p-4 lg:p-0">
          <TagFilter
            tags={availableTags}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
          />
        </div>
      )}
    </div>
  );
}

export function SelectedBubble({
  children,
  onClick,
}: {
  children: string | JSX.Element;
  onClick: () => void;
}) {
  return (
    <div
      className={
        "flex cursor-pointer items-center border border-border " +
        "py-1 my-1.5 rounded-regular px-2 w-fit hover:bg-hover"
      }
      onClick={onClick}
    >
      {children}
      <X className="ml-2" size={14} />
    </div>
  );
}

export function HorizontalFilters({
  timeRange,
  setTimeRange,
  selectedSources,
  setSelectedSources,
  selectedDocumentSets,
  setSelectedDocumentSets,
  availableDocumentSets,
  existingSources,
}: SourceSelectorProps) {
  const handleSourceSelect = (source: SourceMetadata) => {
    setSelectedSources((prev: SourceMetadata[]) => {
      const prevSourceNames = prev.map((source) => source.internalName);
      if (prevSourceNames.includes(source.internalName)) {
        return prev.filter((s) => s.internalName !== source.internalName);
      } else {
        return [...prev, source];
      }
    });
  };

  const handleDocumentSetSelect = (documentSetName: string) => {
    setSelectedDocumentSets((prev: string[]) => {
      if (prev.includes(documentSetName)) {
        return prev.filter((s) => s !== documentSetName);
      } else {
        return [...prev, documentSetName];
      }
    });
  };

  const allSources = listSourceMetadata();
  const availableSources = allSources.filter((source) =>
    existingSources.includes(source.internalName)
  );

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row">
        <DateRangeSearchSelector
          value={timeRange}
          onValueChange={setTimeRange}
          fullWidth
        />

        <Select
          onValueChange={(value) => {
            const selectedSource = allSources.find(
              (source) => source.displayName === value
            );
            if (selectedSource) handleSourceSelect(selectedSource);
          }}
        >
          <SelectTrigger className="w-full lg:w-64">
            <div className="flex items-center gap-3">
              <Map size={16} />
              <SelectValue placeholder="All Sources" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {availableSources.map((source) => (
              <SelectItem key={source.displayName} value={source.displayName}>
                <div className="flex items-center">
                  <SourceIcon sourceType={source.internalName} iconSize={16} />
                  <span className="ml-2 text-sm">{source.displayName}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={(value) => handleDocumentSetSelect(value)}
          defaultValue=""
        >
          <SelectTrigger className="w-full lg:w-64">
            <div className="flex items-center gap-3">
              <Book size={16} />
              <SelectValue placeholder="All Document Sets" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {availableDocumentSets.map((documentSet) => (
              <SelectItem key={documentSet.name} value={documentSet.name}>
                <div className="flex items-center gap-2">
                  <Bookmark /> {documentSet.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex h-12 pb-4 mt-2">
        <div className="flex flex-wrap gap-x-2">
          {timeRange && timeRange.selectValue && (
            <SelectedBubble onClick={() => setTimeRange(null)}>
              <div className="flex text-sm">{timeRange.selectValue}</div>
            </SelectedBubble>
          )}
          {existingSources.length > 0 &&
            selectedSources.map((source) => (
              <SelectedBubble
                key={source.internalName}
                onClick={() => handleSourceSelect(source)}
              >
                <>
                  <SourceIcon sourceType={source.internalName} iconSize={16} />
                  <span className="ml-2 text-sm">{source.displayName}</span>
                </>
              </SelectedBubble>
            ))}
          {selectedDocumentSets.length > 0 &&
            selectedDocumentSets.map((documentSetName) => (
              <SelectedBubble
                key={documentSetName}
                onClick={() => handleDocumentSetSelect(documentSetName)}
              >
                <>
                  <div>
                    <Bookmark />
                  </div>
                  <span className="ml-2 text-sm">{documentSetName}</span>
                </>
              </SelectedBubble>
            ))}
        </div>
      </div>
    </div>
  );
}

export function HorizontalSourceSelector({
  timeRange,
  setTimeRange,
  selectedSources,
  setSelectedSources,
  selectedDocumentSets,
  setSelectedDocumentSets,
  selectedTags,
  setSelectedTags,
  availableDocumentSets,
  existingSources,
  availableTags,
}: SourceSelectorProps) {
  const handleSourceSelect = (source: SourceMetadata) => {
    setSelectedSources((prev: SourceMetadata[]) => {
      if (prev.map((s) => s.internalName).includes(source.internalName)) {
        return prev.filter((s) => s.internalName !== source.internalName);
      } else {
        return [...prev, source];
      }
    });
  };

  const handleDocumentSetSelect = (documentSetName: string) => {
    setSelectedDocumentSets((prev: string[]) => {
      if (prev.includes(documentSetName)) {
        return prev.filter((s) => s !== documentSetName);
      } else {
        return [...prev, documentSetName];
      }
    });
  };

  const handleTagSelect = (tag: Tag) => {
    setSelectedTags((prev: Tag[]) => {
      if (
        prev.some(
          (t) => t.tag_key === tag.tag_key && t.tag_value === tag.tag_value
        )
      ) {
        return prev.filter(
          (t) => !(t.tag_key === tag.tag_key && t.tag_value === tag.tag_value)
        );
      } else {
        return [...prev, tag];
      }
    });
  };

  const resetSources = () => {
    setSelectedSources([]);
  };
  const resetDocuments = () => {
    setSelectedDocumentSets([]);
  };

  const resetTags = () => {
    setSelectedTags([]);
  };

  return (
    <div className="flex flex-nowrap  space-x-2">
      <div className="flex flex-col gap-3 md:flex-row">
        <DateRangeSearchSelector
          value={timeRange}
          onValueChange={setTimeRange}
          fullWidth
        />
      </div>

      {existingSources.length > 0 && (
        <FilterDropdown
          options={listSourceMetadata()
            .filter((source) => existingSources.includes(source.internalName))
            .map((source) => ({
              key: source.internalName,
              display: (
                <>
                  <SourceIcon sourceType={source.internalName} iconSize={16} />
                  <span className="ml-2 text-sm">{source.displayName}</span>
                </>
              ),
            }))}
          selected={selectedSources.map((source) => source.internalName)}
          handleSelect={(option) =>
            handleSourceSelect(
              listSourceMetadata().find((s) => s.internalName === option.key)!
            )
          }
          icon={<FiMap size={16} />}
          defaultDisplay="Sources"
          width="w-fit ellipsis truncate"
          resetValues={resetSources}
          dropdownWidth="w-40"
          optionClassName="truncate w-full break-all ellipsis"
        />
      )}

      {availableDocumentSets.length > 0 && (
        <FilterDropdown
          options={availableDocumentSets.map((documentSet) => ({
            key: documentSet.name,
            display: <>{documentSet.name}</>,
          }))}
          selected={selectedDocumentSets}
          handleSelect={(option) => handleDocumentSetSelect(option.key)}
          icon={<FiBook size={16} />}
          defaultDisplay="Sets"
          resetValues={resetDocuments}
          width="w-fit max-w-24 ellipsis truncate"
          dropdownWidth="max-w-36 w-fit"
          optionClassName="truncate break-all ellipsis"
        />
      )}

      {availableTags.length > 0 && (
        <FilterDropdown
          options={availableTags.map((tag) => ({
            key: `${tag.tag_key}=${tag.tag_value}`,
            display: (
              <span className="text-sm">
                {tag.tag_key}
                <b>=</b>
                {tag.tag_value}
              </span>
            ),
          }))}
          selected={selectedTags.map(
            (tag) => `${tag.tag_key}=${tag.tag_value}`
          )}
          handleSelect={(option) => {
            const [tag_key, tag_value] = option.key.split("=");
            const selectedTag = availableTags.find(
              (tag) => tag.tag_key === tag_key && tag.tag_value === tag_value
            );
            if (selectedTag) {
              handleTagSelect(selectedTag);
            }
          }}
          icon={<FiTag size={16} />}
          defaultDisplay="Tags"
          resetValues={resetTags}
          width="w-fit max-w-24 ellipsis truncate"
          dropdownWidth="max-w-80 w-fit"
          optionClassName="truncate break-all ellipsis"
        />
      )}
    </div>
  );
}
