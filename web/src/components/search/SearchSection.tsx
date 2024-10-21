"use client";

import { useContext, useRef, useState } from "react";
import { SearchBar } from "./SearchBar";
import { SearchResultsDisplay } from "./SearchResultsDisplay";
import { SourceSelector } from "./filtering/Filters";
import { CCPairBasicInfo, Connector, DocumentSet, Tag } from "@/lib/types";
import {
  EnmeddDocument,
  Quote,
  SearchResponse,
  FlowType,
  SearchType,
  SearchDefaultOverrides,
  SearchRequestOverrides,
  ValidQuestionResponse,
} from "@/lib/search/interfaces";
import { searchRequestStreamed } from "@/lib/search/streamingQa";
import { SearchHelper } from "./SearchHelper";
import { CancellationToken, cancellable } from "@/lib/search/cancellable";
import { useFilters, useObjectState } from "@/lib/hooks";
import { questionValidationStreamed } from "@/lib/search/streamingQuestionValidation";
import { Assistant } from "@/app/admin/assistants/interfaces";
import { AssistantSelector } from "./AssistantSelector";
import { computeAvailableFilters } from "@/lib/filters";
import { useParams, useRouter } from "next/navigation";
import { SettingsContext } from "../settings/SettingsProvider";
import { SortSearch } from "./SortSearch";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Filter } from "lucide-react";
import { Button } from "../ui/button";
import { DateRangeSearchSelector } from "./DateRangeSearchSelector";

const SEARCH_DEFAULT_OVERRIDES_START: SearchDefaultOverrides = {
  forceDisplayQA: false,
  offset: 0,
};

const VALID_QUESTION_RESPONSE_DEFAULT: ValidQuestionResponse = {
  reasoning: null,
  answerable: null,
  error: null,
};

interface SearchSectionProps {
  ccPairs: CCPairBasicInfo[];
  documentSets: DocumentSet[];
  assistants: Assistant[];
  tags: Tag[];
  defaultSearchType: SearchType;
}

export const SearchSection = ({
  ccPairs,
  documentSets,
  assistants,
  tags,
  defaultSearchType,
}: SearchSectionProps) => {
  const { teamspaceId } = useParams();
  // Search Bar
  const [query, setQuery] = useState<string>("");

  // Search
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(
    null
  );
  const [isFetching, setIsFetching] = useState(false);

  const [validQuestionResponse, setValidQuestionResponse] =
    useObjectState<ValidQuestionResponse>(VALID_QUESTION_RESPONSE_DEFAULT);

  // Search Type
  const [selectedSearchType, setSelectedSearchType] =
    useState<SearchType>(defaultSearchType);

  const [selectedAssistant, setSelectedAssistant] = useState<number>(
    assistants[0]?.id || 0
  );

  // Filters
  const filterManager = useFilters();
  const availableSources = ccPairs.map((ccPair) => ccPair.source);
  const [finalAvailableSources, finalAvailableDocumentSets] =
    computeAvailableFilters({
      selectedAssistant: assistants.find(
        (assistant) => assistant.id === selectedAssistant
      ),
      availableSources: availableSources,
      availableDocumentSets: documentSets,
    });

  // Overrides for default behavior that only last a single query
  const [defaultOverrides, setDefaultOverrides] =
    useState<SearchDefaultOverrides>(SEARCH_DEFAULT_OVERRIDES_START);

  // Helpers
  const initialSearchResponse: SearchResponse = {
    answer: null,
    quotes: null,
    documents: null,
    suggestedSearchType: null,
    suggestedFlowType: null,
    selectedDocIndices: null,
    error: null,
    messageId: null,
  };
  const updateCurrentAnswer = (answer: string) =>
    setSearchResponse((prevState) => ({
      ...(prevState || initialSearchResponse),
      answer,
    }));
  const updateQuotes = (quotes: Quote[]) =>
    setSearchResponse((prevState) => ({
      ...(prevState || initialSearchResponse),
      quotes,
    }));
  const updateDocs = (documents: EnmeddDocument[]) =>
    setSearchResponse((prevState) => ({
      ...(prevState || initialSearchResponse),
      documents,
    }));
  const updateSuggestedSearchType = (suggestedSearchType: SearchType) =>
    setSearchResponse((prevState) => ({
      ...(prevState || initialSearchResponse),
      suggestedSearchType,
    }));
  const updateSuggestedFlowType = (suggestedFlowType: FlowType) =>
    setSearchResponse((prevState) => ({
      ...(prevState || initialSearchResponse),
      suggestedFlowType,
    }));
  const updateSelectedDocIndices = (docIndices: number[]) =>
    setSearchResponse((prevState) => ({
      ...(prevState || initialSearchResponse),
      selectedDocIndices: docIndices,
    }));
  const updateError = (error: FlowType) =>
    setSearchResponse((prevState) => ({
      ...(prevState || initialSearchResponse),
      error,
    }));
  const updateMessageId = (messageId: number) =>
    setSearchResponse((prevState) => ({
      ...(prevState || initialSearchResponse),
      messageId,
    }));

  let lastSearchCancellationToken = useRef<CancellationToken | null>(null);
  const onSearch = async ({
    searchType,
    offset,
  }: SearchRequestOverrides = {}) => {
    // cancel the prior search if it hasn't finished
    if (lastSearchCancellationToken.current) {
      lastSearchCancellationToken.current.cancel();
    }
    lastSearchCancellationToken.current = new CancellationToken();

    setIsFetching(true);
    setSearchResponse(initialSearchResponse);
    setValidQuestionResponse(VALID_QUESTION_RESPONSE_DEFAULT);

    const searchFnArgs = {
      query,
      sources: filterManager.selectedSources,
      documentSets: filterManager.selectedDocumentSets,
      timeRange: filterManager.timeRange,
      tags: filterManager.selectedTags,
      assistant: assistants.find(
        (assistant) => assistant.id === selectedAssistant
      ) as Assistant,
      updateCurrentAnswer: cancellable({
        cancellationToken: lastSearchCancellationToken.current,
        fn: updateCurrentAnswer,
      }),
      updateQuotes: cancellable({
        cancellationToken: lastSearchCancellationToken.current,
        fn: updateQuotes,
      }),
      updateDocs: cancellable({
        cancellationToken: lastSearchCancellationToken.current,
        fn: updateDocs,
      }),
      updateSuggestedSearchType: cancellable({
        cancellationToken: lastSearchCancellationToken.current,
        fn: updateSuggestedSearchType,
      }),
      updateSuggestedFlowType: cancellable({
        cancellationToken: lastSearchCancellationToken.current,
        fn: updateSuggestedFlowType,
      }),
      updateSelectedDocIndices: cancellable({
        cancellationToken: lastSearchCancellationToken.current,
        fn: updateSelectedDocIndices,
      }),
      updateError: cancellable({
        cancellationToken: lastSearchCancellationToken.current,
        fn: updateError,
      }),
      updateMessageId: cancellable({
        cancellationToken: lastSearchCancellationToken.current,
        fn: updateMessageId,
      }),
      selectedSearchType: searchType ?? selectedSearchType,
      offset: offset ?? defaultOverrides.offset,
    };

    const questionValidationArgs = {
      query,
      update: setValidQuestionResponse,
    };

    await Promise.all([
      searchRequestStreamed(searchFnArgs),
      questionValidationStreamed(questionValidationArgs),
    ]);

    setIsFetching(false);
  };

  // handle redirect if search page is disabled
  // NOTE: this must be done here, in a client component since
  // settings are passed in via Context and therefore aren't
  // available in server-side components
  const router = useRouter();
  const settings = useContext(SettingsContext);
  if (settings?.settings?.search_page_enabled === false) {
    router.push(teamspaceId ? `/t/${teamspaceId}/chat` : "/chat");
  }

  return (
    <div className="relative flex gap-16 lg:gap-10 xl:gap-10 2xl:gap-20 h-full max-w-full ml-auto">
      <div className="w-full flex flex-col gap-5">
        <div className="flex items-center gap-2 relative">
          <SearchBar
            query={query}
            setQuery={setQuery}
            onSearch={async () => {
              setDefaultOverrides(SEARCH_DEFAULT_OVERRIDES_START);
              await onSearch({ offset: 0 });
            }}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <Filter size={16} className="" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[85vw] sm:w-full">
              {(ccPairs.length > 0 || documentSets.length > 0) && (
                <SourceSelector
                  {...filterManager}
                  availableDocumentSets={finalAvailableDocumentSets}
                  existingSources={finalAvailableSources}
                  availableTags={tags}
                />
              )}
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-full flex justify-between flex-col md:flex-row gap-5">
          <div className="items-center gap-2 ml-auto hidden lg:flex">
            <DateRangeSearchSelector
              value={filterManager.timeRange}
              onValueChange={filterManager.setTimeRange}
            />

            <SortSearch />
          </div>
        </div>

        <div className="h-full">
          <SearchResultsDisplay
            searchResponse={searchResponse}
            validQuestionResponse={validQuestionResponse}
            isFetching={isFetching}
            defaultOverrides={defaultOverrides}
            assistantName={
              selectedAssistant
                ? assistants.find((p) => p.id === selectedAssistant)?.name
                : null
            }
            availableDocumentSets={finalAvailableDocumentSets}
          />
        </div>
      </div>

      <div className="min-w-[220px] lg:min-w-[300px] xl:min-w-[320px] max-w-[320px] hidden lg:flex flex-col">
        {(ccPairs.length > 0 || documentSets.length > 0) && (
          <SourceSelector
            {...filterManager}
            availableDocumentSets={finalAvailableDocumentSets}
            existingSources={finalAvailableSources}
            availableTags={tags}
          />
        )}

        <div className="mt-4">
          <SearchHelper
            isFetching={isFetching}
            searchResponse={searchResponse}
            selectedSearchType={selectedSearchType}
            setSelectedSearchType={setSelectedSearchType}
            defaultOverrides={defaultOverrides}
            restartSearch={onSearch}
            forceQADisplay={() =>
              setDefaultOverrides((prevState) => ({
                ...(prevState || SEARCH_DEFAULT_OVERRIDES_START),
                forceDisplayQA: true,
              }))
            }
            setOffset={(offset) => {
              setDefaultOverrides((prevState) => ({
                ...(prevState || SEARCH_DEFAULT_OVERRIDES_START),
                offset,
              }));
            }}
          />
        </div>
      </div>
    </div>
  );
};
