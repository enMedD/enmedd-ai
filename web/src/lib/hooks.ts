import {
  ConnectorIndexingStatus,
  DocumentBoostStatus,
  DocumentSet,
  MinimalUserwithNameSnapshot,
  Tag,
  Teamspace,
  User,
} from "@/lib/types";
import useSWR, { mutate, useSWRConfig } from "swr";
import { errorHandlingFetcher } from "./fetcher";
import { useEffect, useState } from "react";
import { SourceMetadata } from "./search/interfaces";
import { destructureValue } from "./llm/utils";
import { ChatSession } from "@/app/chat/interfaces";
import { UsersResponse } from "./users/interfaces";
import { usePaidEnterpriseFeaturesEnabled } from "@/components/settings/usePaidEnterpriseFeaturesEnabled";
import { DateRange } from "react-day-picker";
import { Credential } from "./connectors/credentials";
import { Assistant } from "@/app/admin/assistants/interfaces";
import { ToolSnapshot } from "@/lib/tools/interfaces";

const CREDENTIAL_URL = "/api/manage/admin/credential";

export const usePublicCredentials = () => {
  const { mutate } = useSWRConfig();
  const swrResponse = useSWR<Credential<any>[]>(
    CREDENTIAL_URL,
    errorHandlingFetcher
  );

  return {
    ...swrResponse,
    refreshCredentials: () => mutate(CREDENTIAL_URL),
  };
};

const buildReactedDocsUrl = (ascending: boolean, limit: number) => {
  return `/api/manage/admin/doc-boosts?ascending=${ascending}&limit=${limit}`;
};

export const useMostReactedToDocuments = (
  ascending: boolean,
  limit: number
) => {
  const url = buildReactedDocsUrl(ascending, limit);
  const swrResponse = useSWR<DocumentBoostStatus[]>(url, errorHandlingFetcher);

  return {
    ...swrResponse,
    refreshDocs: () => mutate(url),
  };
};

export const useObjectState = <T>(
  initialValue: T
): [T, (update: Partial<T>) => void] => {
  const [state, setState] = useState<T>(initialValue);
  const set = (update: Partial<T>) => {
    setState((prevState) => {
      return {
        ...prevState,
        ...update,
      };
    });
  };
  return [state, set];
};

const INDEXING_STATUS_URL = "/api/manage/admin/connector/indexing-status";

export const useConnectorCredentialIndexingStatus = (
  refreshInterval = 30000, // 30 seconds
  getEditable = false,
  teamspaceId?: string | string[]
) => {
  const { mutate } = useSWRConfig();
  const url =
    `${INDEXING_STATUS_URL}?${getEditable ? "get_editable=true" : ""}${getEditable && teamspaceId ? "&" : ""}${teamspaceId ? `teamspace_id=${teamspaceId}` : ""}`.replace(
      /&$/,
      ""
    );

  const swrResponse = useSWR<ConnectorIndexingStatus<any, any>[]>(
    url,
    errorHandlingFetcher,
    { refreshInterval: refreshInterval }
  );

  return {
    ...swrResponse,
    refreshIndexingStatus: () => mutate(url),
  };
};

export const useTimeRange = (initialValue?: DateRange) => {
  return useState<DateRange | null>(null);
};

export interface FilterManager {
  timeRange: DateRange | null;
  setTimeRange: React.Dispatch<React.SetStateAction<DateRange | null>>;
  selectedSources: SourceMetadata[];
  setSelectedSources: React.Dispatch<React.SetStateAction<SourceMetadata[]>>;
  selectedDocumentSets: string[];
  setSelectedDocumentSets: React.Dispatch<React.SetStateAction<string[]>>;
  selectedTags: Tag[];
  setSelectedTags: React.Dispatch<React.SetStateAction<Tag[]>>;
}

export function useFilters(): FilterManager {
  const [timeRange, setTimeRange] = useTimeRange();
  const [selectedSources, setSelectedSources] = useState<SourceMetadata[]>([]);
  const [selectedDocumentSets, setSelectedDocumentSets] = useState<string[]>(
    []
  );
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  return {
    timeRange,
    setTimeRange,
    selectedSources,
    setSelectedSources,
    selectedDocumentSets,
    setSelectedDocumentSets,
    selectedTags,
    setSelectedTags,
  };
}

export const useUsers = (
  q?: string,
  acceptedPage?: number,
  invitedPage?: number,
  teamspaceId?: string | string[]
) => {
  const baseUrl = "/api/manage/users";

  const userApiUrl = (() => {
    if (
      q ||
      acceptedPage !== undefined ||
      invitedPage !== undefined ||
      teamspaceId
    ) {
      const queryParams = new URLSearchParams();
      if (q) queryParams.append("q", encodeURI(q));
      if (acceptedPage !== undefined)
        queryParams.append("accepted_page", (acceptedPage - 1).toString());
      if (invitedPage !== undefined)
        queryParams.append("invited_page", (invitedPage - 1).toString());
      if (teamspaceId)
        queryParams.append("teamspace_id", teamspaceId.toString());

      return `${baseUrl}?${queryParams.toString()}`;
    }
    return baseUrl;
  })();

  const swrResponse = useSWR<UsersResponse>(userApiUrl, errorHandlingFetcher);

  return {
    ...swrResponse,
    refreshUsers: () => mutate(userApiUrl),
  };
};

const USERS_URL = "/api/users";

export const useTeamspaceUsers = (
  teamspaceId?: string | string[]
): {
  data: User[] | undefined;
  isLoading: boolean;
  error: string;
  refreshTeamspaceUsers: () => void;
} => {
  const queryParams = new URLSearchParams({
    ...(teamspaceId ? { teamspace_id: teamspaceId.toString() } : {}),
    include_teamspace_user: "false",
  });

  const swrResponse = useSWR<User[]>(
    `${USERS_URL}?${queryParams}`,
    errorHandlingFetcher
  );

  return {
    ...swrResponse,
    isLoading: !swrResponse.error && !swrResponse.data,
    refreshTeamspaceUsers: () => mutate(`${USERS_URL}?${queryParams}`),
  };
};

export interface LlmOverride {
  name: string;
  provider: string;
  modelName: string;
}

export interface LlmOverrideManager {
  llmOverride: LlmOverride;
  setLlmOverride: React.Dispatch<React.SetStateAction<LlmOverride>>;
  globalDefault: LlmOverride;
  setGlobalDefault: React.Dispatch<React.SetStateAction<LlmOverride>>;
  temperature: number | null;
  setTemperature: React.Dispatch<React.SetStateAction<number | null>>;
  updateModelOverrideForChatSession: (chatSession?: ChatSession) => void;
}
export function useLlmOverride(
  globalModel?: string | null,
  currentChatSession?: ChatSession,
  defaultTemperature?: number
): LlmOverrideManager {
  const [globalDefault, setGlobalDefault] = useState<LlmOverride>(
    globalModel != null
      ? destructureValue(globalModel)
      : {
          name: "",
          provider: "",
          modelName: "",
        }
  );

  const [llmOverride, setLlmOverride] = useState<LlmOverride>(
    currentChatSession && currentChatSession.current_alternate_model
      ? destructureValue(currentChatSession.current_alternate_model)
      : {
          name: "",
          provider: "",
          modelName: "",
        }
  );

  const updateModelOverrideForChatSession = (chatSession?: ChatSession) => {
    setLlmOverride(
      chatSession && chatSession.current_alternate_model
        ? destructureValue(chatSession.current_alternate_model)
        : globalDefault
    );
  };

  const [temperature, setTemperature] = useState<number | null>(
    defaultTemperature != undefined ? defaultTemperature : 0
  );

  useEffect(() => {
    setGlobalDefault(
      globalModel != null
        ? destructureValue(globalModel)
        : {
            name: "",
            provider: "",
            modelName: "",
          }
    );
  }, [globalModel]);

  useEffect(() => {
    setTemperature(defaultTemperature !== undefined ? defaultTemperature : 0);
  }, [defaultTemperature]);

  return {
    updateModelOverrideForChatSession,
    llmOverride,
    setLlmOverride,
    globalDefault,
    setGlobalDefault,
    temperature,
    setTemperature,
  };
}
/* 
EE Only APIs
*/

const TEAMSPACE_URL = "/api/manage/admin/teamspace";

export const useTeamspaces = (): {
  data: Teamspace[] | undefined;
  isLoading: boolean;
  error: string;
  refreshTeamspaces: () => void;
} => {
  const swrResponse = useSWR<Teamspace[]>(TEAMSPACE_URL, errorHandlingFetcher);
  const isPaidEnterpriseFeaturesEnabled = usePaidEnterpriseFeaturesEnabled();

  if (!isPaidEnterpriseFeaturesEnabled) {
    return {
      ...{
        data: [],
        isLoading: false,
        error: "",
      },
      refreshTeamspaces: () => {},
    };
  }

  return {
    ...swrResponse,
    refreshTeamspaces: () => mutate(TEAMSPACE_URL),
  };
};

export const useTeamspace = (
  teamspaceId: string | string[]
): {
  data: Teamspace | undefined;
  isLoading: boolean;
  error: string;
  refreshTeamspace: () => void;
} => {
  const url = `${TEAMSPACE_URL}/${teamspaceId}`;

  const swrResponse = useSWR<Teamspace>(url, errorHandlingFetcher);
  const isPaidEnterpriseFeaturesEnabled = usePaidEnterpriseFeaturesEnabled();

  if (!isPaidEnterpriseFeaturesEnabled) {
    return {
      data: undefined,
      isLoading: false,
      error: "",
      refreshTeamspace: () => {},
    };
  }

  const { data, error, isValidating, mutate } = swrResponse;

  return {
    data,
    isLoading: isValidating,
    error: error ? error.message : "",
    refreshTeamspace: () => mutate(),
  };
};

const USER_TEAMSPACES_URL = "/api/teamspace/user-list";

export const useUserTeamspaces = (): {
  data: Teamspace[] | undefined;
  isLoading: boolean;
  error: string;
  refreshUserTeamspaces: () => void;
} => {
  const { data, error, mutate } = useSWR<Teamspace[]>(
    USER_TEAMSPACES_URL,
    errorHandlingFetcher
  );

  return {
    data,
    isLoading: !data && !error,
    error: error?.message || "",
    refreshUserTeamspaces: () => mutate(),
  };
};

const TOOL_URL = "/api/tool";

export function refreshTools() {
  mutate(TOOL_URL);
}

export function useTools() {
  const url = `${TOOL_URL}`;

  const swrResponse = useSWR<ToolSnapshot[]>(url, errorHandlingFetcher, {
    refreshInterval: 5000, // 5 seconds
  });

  return {
    ...swrResponse,
    refreshTools: refreshTools,
  };
}

const ADMIN_ASSISTANT_URL = "/api/admin/assistant";

export function refreshAdminAssistants() {
  mutate(ADMIN_ASSISTANT_URL);
}

export function useAdminAssistants(
  getEditable: boolean = false,
  teamspaceId?: string | string[]
) {
  const url = `${ADMIN_ASSISTANT_URL}?${
    getEditable ? "get_editable=true" : ""
  }${getEditable && teamspaceId ? "&" : ""}${
    teamspaceId ? `teamspace_id=${teamspaceId}` : ""
  }`.replace(/&$/, "");

  const swrResponse = useSWR<Assistant[]>(url, errorHandlingFetcher, {
    refreshInterval: 5000, // 5 seconds
  });

  return {
    ...swrResponse,
    refreshAdminAssistants: refreshAdminAssistants,
  };
}

const DOCUMENT_SETS_URL = "/api/manage/admin/document-set";

export function refreshDocumentSets() {
  mutate(DOCUMENT_SETS_URL);
}

export function useDocumentSets(
  getEditable: boolean = false,
  teamspaceId?: string | string[]
) {
  const url = `${DOCUMENT_SETS_URL}?${
    getEditable ? "get_editable=true" : ""
  }${getEditable && teamspaceId ? "&" : ""}${
    teamspaceId ? `teamspace_id=${teamspaceId}` : ""
  }`.replace(/&$/, "");

  const swrResponse = useSWR<DocumentSet[]>(url, errorHandlingFetcher, {
    refreshInterval: 5000, // 5 seconds
  });

  return {
    ...swrResponse,
    refreshDocumentSets: refreshDocumentSets,
  };
}

const MODEL_DISPLAY_NAMES: { [key: string]: string } = {
  // OpenAI models
  "o1-mini": "O1 Mini",
  "o1-preview": "O1 Preview",
  "gpt-4": "GPT 4",
  "gpt-4o": "GPT 4o",
  "gpt-4o-2024-08-06": "GPT 4o (Structured Outputs)",
  "gpt-4o-mini": "GPT 4o Mini",
  "gpt-4-0314": "GPT 4 (March 2023)",
  "gpt-4-0613": "GPT 4 (June 2023)",
  "gpt-4-32k-0314": "GPT 4 32k (March 2023)",
  "gpt-4-turbo": "GPT 4 Turbo",
  "gpt-4-turbo-preview": "GPT 4 Turbo (Preview)",
  "gpt-4-1106-preview": "GPT 4 Turbo (November 2023)",
  "gpt-4-vision-preview": "GPT 4 Vision (Preview)",
  "gpt-3.5-turbo": "GPT 3.5 Turbo",
  "gpt-3.5-turbo-0125": "GPT 3.5 Turbo (January 2024)",
  "gpt-3.5-turbo-1106": "GPT 3.5 Turbo (November 2023)",
  "gpt-3.5-turbo-16k": "GPT 3.5 Turbo 16k",
  "gpt-3.5-turbo-0613": "GPT 3.5 Turbo (June 2023)",
  "gpt-3.5-turbo-16k-0613": "GPT 3.5 Turbo 16k (June 2023)",
  "gpt-3.5-turbo-0301": "GPT 3.5 Turbo (March 2023)",

  // Anthropic models
  "claude-3-opus-20240229": "Claude 3 Opus",
  "claude-3-sonnet-20240229": "Claude 3 Sonnet",
  "claude-3-haiku-20240307": "Claude 3 Haiku",
  "claude-2.1": "Claude 2.1",
  "claude-2.0": "Claude 2.0",
  "claude-instant-1.2": "Claude Instant 1.2",
  "claude-3-5-sonnet-20240620": "Claude 3.5 Sonnet",

  // Bedrock models
  "meta.llama3-1-70b-instruct-v1:0": "Llama 3.1 70B",
  "meta.llama3-1-8b-instruct-v1:0": "Llama 3.1 8B",
  "meta.llama3-70b-instruct-v1:0": "Llama 3 70B",
  "meta.llama3-8b-instruct-v1:0": "Llama 3 8B",
  "meta.llama2-70b-chat-v1": "Llama 2 70B",
  "meta.llama2-13b-chat-v1": "Llama 2 13B",
  "cohere.command-r-v1:0": "Command R",
  "cohere.command-r-plus-v1:0": "Command R Plus",
  "cohere.command-light-text-v14": "Command Light Text",
  "cohere.command-text-v14": "Command Text",
  "anthropic.claude-instant-v1": "Claude Instant",
  "anthropic.claude-v2:1": "Claude v2.1",
  "anthropic.claude-v2": "Claude v2",
  "anthropic.claude-v1": "Claude v1",
  "anthropic.claude-3-opus-20240229-v1:0": "Claude 3 Opus",
  "anthropic.claude-3-haiku-20240307-v1:0": "Claude 3 Haiku",
  "anthropic.claude-3-5-sonnet-20240620-v1:0": "Claude 3.5 Sonnet",
  "anthropic.claude-3-sonnet-20240229-v1:0": "Claude 3 Sonnet",
  "mistral.mistral-large-2402-v1:0": "Mistral Large",
  "mistral.mixtral-8x7b-instruct-v0:1": "Mixtral 8x7B Instruct",
  "mistral.mistral-7b-instruct-v0:2": "Mistral 7B Instruct",
  "amazon.titan-text-express-v1": "Titan Text Express",
  "amazon.titan-text-lite-v1": "Titan Text Lite",
  "ai21.jamba-instruct-v1:0": "Jamba Instruct",
  "ai21.j2-ultra-v1": "J2 Ultra",
  "ai21.j2-mid-v1": "J2 Mid",
};

export function getDisplayNameForModel(modelName: string): string {
  return MODEL_DISPLAY_NAMES[modelName] || modelName;
}

export const defaultModelsByProvider: { [name: string]: string[] } = {
  openai: ["gpt-4", "gpt-4o", "gpt-4o-mini", "o1-mini", "o1-preview"],
  bedrock: [
    "meta.llama3-1-70b-instruct-v1:0",
    "meta.llama3-1-8b-instruct-v1:0",
    "anthropic.claude-3-opus-20240229-v1:0",
    "mistral.mistral-large-2402-v1:0",
    "anthropic.claude-3-5-sonnet-20240620-v1:0",
  ],
  anthropic: ["claude-3-opus-20240229", "claude-3-5-sonnet-20240620"],
};
