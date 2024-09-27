import {
  AuthTypeMetadata,
  getAuthTypeMetadataSS,
  getCurrentUserSS,
} from "@/lib/userSS";
import { fetchSS } from "@/lib/utilsSS";
import {
  CCPairBasicInfo,
  DocumentSet,
  Tag,
  Teamspace,
  TeamspaceChatData,
  User,
  ValidSources,
} from "@/lib/types";
import { ChatSession } from "@/app/chat/[teamspace_id]/interfaces";
import { Assistant } from "@/app/admin/assistants/interfaces";
import { FullEmbeddingModelResponse } from "@/app/admin/models/embedding/embeddingModels";
import { Settings } from "@/app/admin/settings/interfaces";
import { fetchLLMProvidersSS } from "@/lib/llm/fetchLLMs";
import { LLMProviderDescriptor } from "@/app/admin/models/llm/interfaces";
import { Folder } from "@/app/chat/[teamspace_id]/folders/interfaces";
import { assistantComparator } from "@/app/admin/assistants/lib";
import { cookies } from "next/headers";
import { DOCUMENT_SIDEBAR_WIDTH_COOKIE_NAME } from "@/components/resizable/contants";
import { hasCompletedWelcomeFlowSS } from "@/components/initialSetup/welcome/WelcomeModalWrapper";

interface FetchChatDataResult {
  user: User | null;
  chatSessions: ChatSession[];
  ccPairs: CCPairBasicInfo[];
  availableSources: ValidSources[];
  documentSets: DocumentSet[];
  assistants: Assistant[];
  tags: Tag[];
  llmProviders: LLMProviderDescriptor[];
  folders: Folder[];
  openedFolders: Record<string, boolean>;
  defaultAssistantId?: number;
  finalDocumentSidebarInitialWidth?: number;
  shouldShowWelcomeModal: boolean;
  shouldDisplaySourcesIncompleteModal: boolean;
}

export async function fetchTeamChatData(
  teamspace_id: string,
  searchParams: {
    [key: string]: string;
  }
): Promise<FetchChatDataResult | { redirect: string }> {
  const tasks = [
    getAuthTypeMetadataSS(),
    getCurrentUserSS(),
    fetchSS(`/manage/teamspace/${teamspace_id}`),
    fetchSS(`/manage/indexing-status?teamspace_id=${teamspace_id}`),
    fetchSS("/assistant?include_default=true"),
    fetchSS(`/query/valid-tags`),
    fetchLLMProvidersSS(),
    fetchSS(`/folder`),
  ];

  let results: (
    | User
    | TeamspaceChatData
    | Response
    | AuthTypeMetadata
    | FullEmbeddingModelResponse
    | Settings
    | LLMProviderDescriptor[]
    | null
  )[] = [null, null, null, null, null, null, null, null];
  try {
    results = await Promise.all(tasks);
  } catch (e) {
    console.log(`Some fetch failed for the main search page - ${e}`);
  }

  const authTypeMetadata = results[0] as AuthTypeMetadata | null;
  const user = results[1] as User | null;
  const teamspaceResponse = results[2] as Response | null;
  const ccPairsResponse = results[3] as Response | null;
  // const documentSetsResponse = results[3] as Response | null;
  const assistantsResponse = results[4] as Response | null;
  // const chatSessionsResponse = results[5] as Response | null;
  const tagsResponse = results[5] as Response | null;
  const llmProviders = (results[6] || []) as LLMProviderDescriptor[];
  const foldersResponse = results[7] as Response | null; // Handle folders result

  const authDisabled = authTypeMetadata?.authType === "disabled";
  if (!authDisabled && !user) {
    return { redirect: "/auth/login" };
  }

  if (user && !user.is_verified && authTypeMetadata?.requiresVerification) {
    return { redirect: "/auth/waiting-on-verification" };
  }

  let ccPairs: CCPairBasicInfo[] = [];
  if (ccPairsResponse?.ok) {
    ccPairs = await ccPairsResponse.json();
  } else {
    console.log(`Failed to fetch connectors - ${ccPairsResponse?.status}`);
  }
  const availableSources: ValidSources[] = [];
  ccPairs.forEach((ccPair) => {
    if (!availableSources.includes(ccPair.source)) {
      availableSources.push(ccPair.source);
    }
  });

  let teamspaceData: TeamspaceChatData;
  let chatSessions: ChatSession[] = [];
  let documentSets: DocumentSet[] = [];
  if (teamspaceResponse?.ok) {
    teamspaceData = await teamspaceResponse.json();
    chatSessions = teamspaceData.chat_sessions;
    documentSets = teamspaceData.document_sets;
  } else {
    console.log(`Failed to fetch teamspace ${teamspace_id}`);
  }
  // Larger ID -> created later
  chatSessions.sort((a, b) => (a.id > b.id ? -1 : 1));

  let assistants: Assistant[] = [];
  if (assistantsResponse?.ok) {
    assistants = await assistantsResponse.json();
  } else {
    console.log(`Failed to fetch assistants - ${assistantsResponse?.status}`);
  }
  // remove those marked as hidden by an admin
  assistants = assistants.filter((assistant) => assistant.is_visible);

  // sort them in priority order
  assistants.sort(assistantComparator);

  let tags: Tag[] = [];
  if (tagsResponse?.ok) {
    tags = (await tagsResponse.json()).tags;
  } else {
    console.log(`Failed to fetch tags - ${tagsResponse?.status}`);
  }

  const defaultAssistantIdRaw = searchParams["assistantId"];
  const defaultAssistantId = defaultAssistantIdRaw
    ? parseInt(defaultAssistantIdRaw)
    : undefined;

  const documentSidebarCookieInitialWidth = cookies().get(
    DOCUMENT_SIDEBAR_WIDTH_COOKIE_NAME
  );
  const finalDocumentSidebarInitialWidth = documentSidebarCookieInitialWidth
    ? parseInt(documentSidebarCookieInitialWidth.value)
    : undefined;

  const hasAnyConnectors = ccPairs.length > 0;
  const shouldShowWelcomeModal =
    !hasCompletedWelcomeFlowSS() &&
    !hasAnyConnectors &&
    (!user || user.role === "admin");
  const shouldDisplaySourcesIncompleteModal =
    hasAnyConnectors &&
    !shouldShowWelcomeModal &&
    !ccPairs.some(
      (ccPair) => ccPair.has_successful_run && ccPair.docs_indexed > 0
    );

  // if no connectors are setup, only show assistants that are pure
  // passthrough and don't do any retrieval
  if (!hasAnyConnectors) {
    assistants = assistants.filter((assistant) => assistant.num_chunks === 0);
  }

  let folders: Folder[] = [];
  if (foldersResponse?.ok) {
    folders = (await foldersResponse.json()).folders as Folder[];
  } else {
    console.log(`Failed to fetch folders - ${foldersResponse?.status}`);
  }

  const openedFoldersCookie = cookies().get("openedFolders");
  const openedFolders = openedFoldersCookie
    ? JSON.parse(openedFoldersCookie.value)
    : {};

  return {
    user,
    chatSessions,
    ccPairs,
    availableSources,
    documentSets,
    assistants,
    tags,
    llmProviders,
    folders,
    openedFolders,
    defaultAssistantId,
    finalDocumentSidebarInitialWidth,
    shouldShowWelcomeModal,
    shouldDisplaySourcesIncompleteModal,
  };
}
