"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BackendChatSession,
  BackendMessage,
  BUFFER_COUNT,
  ChatFileType,
  ChatSessionSharedStatus,
  DocumentsResponse,
  FileDescriptor,
  ImageGenerationDisplay,
  Message,
  MessageResponseIDInfo,
  RetrievalType,
  StreamingError,
  ToolCallMetadata,
} from "./interfaces";

import { Assistant } from "../admin/assistants/interfaces";
import { HealthCheckBanner } from "@/components/health/healthcheck";
import {
  buildChatUrl,
  buildLatestMessageChain,
  checkAnyAssistantHasSearch,
  createChatSession,
  getCitedDocumentsFromMessage,
  getHumanAndAIMessageFromMessageNumber,
  getLastSuccessfulMessageId,
  handleChatFeedback,
  nameChatSession,
  PacketType,
  assistantIncludesRetrieval,
  processRawChatHistory,
  removeMessage,
  sendMessage,
  setMessageAsLatest,
  updateParentChildren,
  uploadFilesForChat,
  useScrollonStream,
} from "./lib";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { SEARCH_PARAM_NAMES, shouldSubmitOnLoad } from "./searchParams";
import { useDocumentSelection } from "./useDocumentSelection";
import { LlmOverride, useFilters, useLlmOverride } from "@/lib/hooks";
import { computeAvailableFilters } from "@/lib/filters";
import { ChatState, FeedbackType, RegenerationState } from "./types";
import { DocumentSidebar } from "./documentSidebar/DocumentSidebar";
import { InitializingLoader } from "@/components/InitializingLoader";
import { ShareChatSessionModal } from "./modal/ShareChatSessionModal";
import { ChatIntro } from "./ChatIntro";
import { AIMessage, HumanMessage } from "./message/Messages";
import { StarterMessage } from "./StarterMessage";
import {
  AnswerPiecePacket,
  EnmeddDocument,
  StreamStopInfo,
  StreamStopReason,
} from "@/lib/search/interfaces";
import { buildFilters } from "@/lib/search/utils";
import { SettingsContext } from "@/components/settings/SettingsProvider";
import Dropzone from "react-dropzone";
import {
  checkLLMSupportsImageInput,
  getFinalLLM,
  destructureValue,
  getLLMProviderOverrideForAssistant,
} from "@/lib/llm/utils";
import { ChatInputBar } from "./input/ChatInputBar";
import { v4 as uuidv4 } from "uuid";
import { ChatPopup } from "./ChatPopup";
import FixedLogo from "./shared_chat_search/FixedLogo";
import { SetDefaultModelModal } from "./modal/SetDefaultModelModal";
import { MinimalMarkdown } from "@/components/chat_search/MinimalMarkdown";
import ExceptionTraceModal from "@/components/modals/ExceptionTraceModal";
import { SEARCH_TOOL_NAME } from "./tools/constants";
import { useUser } from "@/components/user/UserProvider";
import { ApiKeyModal } from "@/components/llm/ApiKeyModal";
import { useChatContext } from "@/context/ChatContext";
import Prism from "prismjs";
import { useToast } from "@/hooks/use-toast";
import { ChatSidebar } from "./sessionSidebar/ChatSidebar";
import { HelperButton } from "@/components/HelperButton";
import { CircleArrowDown } from "lucide-react";
import { StarterMessage as StarterMessageType } from "../admin/assistants/interfaces";
import { Skeleton } from "@/components/ui/skeleton";
import { SIDEBAR_WIDTH_CONST } from "@/lib/constants";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAssistants } from "@/context/AssistantsContext";
import { NoAssistantModal } from "@/components/modals/NoAssistantModal";
import { NoValidAssistantModal } from "./NoValidAssistantModal";
import { FeatureFlagWrapper } from "@/components/feature_flag/FeatureFlagWrapper";
import Sidebar from "@/components/Sidebar";
import {
  Sidebar as SidebarSidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const TEMP_USER_MESSAGE_ID = -1;
const TEMP_ASSISTANT_MESSAGE_ID = -2;
const SYSTEM_MESSAGE_ID = -3;

const Inset = ({
  open,
  children,
  openFalse,
  openTrue,
}: {
  open: boolean;
  children: (toggleSidebar: () => void) => React.ReactNode;
  openFalse: () => void;
  openTrue: () => void;
}) => {
  const { toggleSidebar: toggleRightSidebar } = useSidebar();

  const handleSidbarToggle = () => {
    if (open) {
      openFalse();
    } else {
      openTrue();
    }
    toggleRightSidebar();
  };

  return (
    <SidebarInset className="w-full overflow-hidden">
      <header className="flex h-16 shrink-0 items-center gap-2 px-4 absolute top-0 right-0">
        {open && (
          <SidebarTrigger className="-mr-1" onClick={() => openFalse()} />
        )}
      </header>
      {children(handleSidbarToggle)}
    </SidebarInset>
  );
};

export function ChatPage({
  documentSidebarInitialWidth,
  teamspaceId,
}: {
  documentSidebarInitialWidth?: number;
  teamspaceId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  let {
    chatSessions,
    availableSources,
    availableDocumentSets,
    llmProviders,
    folders,
    openedFolders,
    userInputPrompts,
    defaultAssistantId,
    shouldShowWelcomeModal,
    refreshChatSessions,
  } = useChatContext();

  const { toast } = useToast();

  const [showApiKeyModal, setShowApiKeyModal] = useState(true);

  const { user, isAdmin, isLoadingUser, refreshUser, isTeamspaceAdmin } =
    useUser();

  const existingChatIdRaw = searchParams.get("chatId");
  const currentAssistantId = searchParams.get(SEARCH_PARAM_NAMES.ASSISTANT_ID);

  const existingChatSessionId = existingChatIdRaw
    ? parseInt(existingChatIdRaw)
    : null;

  const selectedChatSession = chatSessions.find(
    (chatSession) => chatSession.id === existingChatSessionId
  );

  const chatSessionIdRef = useRef<number | null>(existingChatSessionId);

  // Only updates on session load (ie. rename / switching chat session)
  // Useful for determining which session has been loaded (i.e. still on `new, empty session` or `previous session`)
  const loadedIdSessionRef = useRef<number | null>(existingChatSessionId);

  const { assistants: availableAssistants, finalAssistants } = useAssistants();

  const existingChatSessionAssistantId = selectedChatSession?.assistant_id;
  const [selectedAssistant, setSelectedAssistant] = useState<
    Assistant | undefined
  >(
    // NOTE: look through available assistants here, so that even if the user
    // has hidden this assistant it still shows the correct assistant when
    // going back to an old chat session
    existingChatSessionAssistantId !== undefined
      ? availableAssistants.find(
          (assistant) => assistant.id === existingChatSessionAssistantId
        )
      : defaultAssistantId !== undefined
        ? availableAssistants.find(
            (assistant) => assistant.id === defaultAssistantId
          )
        : undefined
  );

  // Gather default temperature settings
  const search_param_temperature = searchParams.get(
    SEARCH_PARAM_NAMES.TEMPERATURE
  );
  const defaultTemperature = search_param_temperature
    ? parseFloat(search_param_temperature)
    : selectedAssistant?.tools.some(
          (tool) =>
            tool.in_code_tool_id === "SearchTool" ||
            tool.in_code_tool_id === "InternetSearchTool"
        )
      ? 0
      : 0.7;

  const setSelectedAssistantFromId = (assistantId: number) => {
    // NOTE: also intentionally look through available assistants here, so that
    // even if the user has hidden an assistant they can still go back to it
    // for old chats
    setSelectedAssistant(
      availableAssistants.find((assistant) => assistant.id === assistantId)
    );
  };

  const llmOverrideManager = useLlmOverride(
    user?.preferences.default_model ?? null,
    selectedChatSession,
    defaultTemperature
  );

  const [alternativeAssistant, setAlternativeAssistant] =
    useState<Assistant | null>(null);

  const liveAssistant =
    alternativeAssistant ||
    selectedAssistant ||
    finalAssistants[0] ||
    availableAssistants[0];

  const noAssistants = liveAssistant == null || liveAssistant == undefined;

  if (noAssistants) {
    return (
      <NoValidAssistantModal
        assistants={liveAssistant}
        teamspaceId={teamspaceId}
        isTeamspaceAdmin={isTeamspaceAdmin}
        isAdmin={isAdmin}
      />
    );
  }

  useEffect(() => {
    if (!loadedIdSessionRef.current && !currentAssistantId) {
      return;
    }

    const assistantDefault = getLLMProviderOverrideForAssistant(
      liveAssistant,
      llmProviders
    );

    if (assistantDefault) {
      llmOverrideManager.setLlmOverride(assistantDefault);
    } else if (user?.preferences.default_model) {
      llmOverrideManager.setLlmOverride(
        destructureValue(user?.preferences.default_model)
      );
    }
  }, [liveAssistant, llmProviders, user?.preferences.default_model]);

  const stopGenerating = () => {
    const currentSession = currentSessionId();
    const controller = abortControllers.get(currentSession);
    if (controller) {
      controller.abort();
      setAbortControllers((prev) => {
        const newControllers = new Map(prev);
        newControllers.delete(currentSession);
        return newControllers;
      });
    }

    const lastMessage = messageHistory[messageHistory.length - 1];
    if (
      lastMessage &&
      lastMessage.type === "assistant" &&
      lastMessage.toolCalls[0] &&
      lastMessage.toolCalls[0].tool_result === undefined
    ) {
      const newCompleteMessageMap = new Map(
        currentMessageMap(completeMessageDetail)
      );
      const updatedMessage = { ...lastMessage, toolCalls: [] };
      newCompleteMessageMap.set(lastMessage.messageId, updatedMessage);
      updateCompleteMessageDetail(currentSession, newCompleteMessageMap);
    }

    updateChatState("input", currentSession);
  };

  // this is for "@"ing assistants

  // this is used to track which assistant is being used to generate the current message
  // for example, this would come into play when:
  // 1. default assistant is `Arnold`
  // 2. we "@"ed the `GPT` assistant and sent a message
  // 3. while the `GPT` assistant message is generating, we "@" the `Paraphrase` assistant
  const [alternativeGeneratingAssistant, setAlternativeGeneratingAssistant] =
    useState<Assistant | null>(null);

  // used to track whether or not the initial "submit on load" has been performed
  // this only applies if `?submit-on-load=true` or `?submit-on-load=1` is in the URL
  // NOTE: this is required due to React strict mode, where all `useEffect` hooks
  // are run twice on initial load during development
  const submitOnLoadPerformed = useRef<boolean>(false);

  // fetch messages for the chat session
  const [isFetchingChatMessages, setIsFetchingChatMessages] = useState(
    existingChatSessionId !== null
  );

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
    setIsReady(true);
  }, []);

  // this is triggered every time the user switches which chat
  // session they are using
  useEffect(() => {
    const priorChatSessionId = chatSessionIdRef.current;
    const loadedSessionId = loadedIdSessionRef.current;
    chatSessionIdRef.current = existingChatSessionId;
    loadedIdSessionRef.current = existingChatSessionId;

    textAreaRef.current?.focus();

    // only clear things if we're going from one chat session to another
    const isChatSessionSwitch =
      chatSessionIdRef.current !== null &&
      existingChatSessionId !== priorChatSessionId;
    if (isChatSessionSwitch) {
      // de-select documents
      clearSelectedDocuments();

      // reset all filters
      filterManager.setSelectedDocumentSets([]);
      filterManager.setSelectedSources([]);
      filterManager.setSelectedTags([]);
      filterManager.setTimeRange(null);

      // reset LLM overrides (based on chat session!)
      llmOverrideManager.updateModelOverrideForChatSession(selectedChatSession);
      llmOverrideManager.setTemperature(null);

      // remove uploaded files
      setCurrentMessageFiles([]);

      // if switching from one chat to another, then need to scroll again
      // if we're creating a brand new chat, then don't need to scroll
      if (chatSessionIdRef.current !== null) {
        setHasPerformedInitialScroll(false);
      }
    }

    async function initialSessionFetch() {
      if (existingChatSessionId === null) {
        setIsFetchingChatMessages(false);
        if (defaultAssistantId !== undefined) {
          setSelectedAssistantFromId(defaultAssistantId);
        } else {
          setSelectedAssistant(undefined);
        }
        updateCompleteMessageDetail(null, new Map());
        setChatSessionSharedStatus(ChatSessionSharedStatus.Private);

        // if we're supposed to submit on initial load, then do that here
        if (
          shouldSubmitOnLoad(searchParams) &&
          !submitOnLoadPerformed.current
        ) {
          submitOnLoadPerformed.current = true;
          await onSubmit();
        }
        return;
      }
      const shouldScrollToBottom =
        visibleRange.get(existingChatSessionId) === undefined ||
        visibleRange.get(existingChatSessionId)?.end == 0;

      clearSelectedDocuments();
      setIsFetchingChatMessages(true);
      const response = await fetch(
        `/api/chat/get-chat-session/${existingChatSessionId}`
      );

      const chatSession = (await response.json()) as BackendChatSession;
      setSelectedAssistantFromId(chatSession.assistant_id);

      const newMessageMap = processRawChatHistory(chatSession.messages);
      const newMessageHistory = buildLatestMessageChain(newMessageMap);

      // Update message history except for edge where where
      // last message is an error and we're on a new chat.
      // This corresponds to a "renaming" of chat, which occurs after first message
      // stream
      if (
        (messageHistory[messageHistory.length - 1]?.type !== "error" ||
          loadedSessionId != null) &&
        !currentChatAnswering()
      ) {
        updateCompleteMessageDetail(chatSession.chat_session_id, newMessageMap);

        const latestMessageId =
          newMessageHistory[newMessageHistory.length - 1]?.messageId;
        setSelectedMessageForDocDisplay(
          latestMessageId !== undefined ? latestMessageId : null
        );
      }

      setChatSessionSharedStatus(chatSession.shared_status);

      // go to bottom. If initial load, then do a scroll,
      // otherwise just appear at the bottom
      if (shouldScrollToBottom) {
        scrollInitialized.current = false;
      }

      if (shouldScrollToBottom) {
        if (!hasPerformedInitialScroll) {
          clientScrollToBottom();
        } else if (isChatSessionSwitch) {
          clientScrollToBottom(true);
        }
      } else if (chatSession.messages.length <= 10) {
        setIsFetchingChatMessages(false);
        setTimeout(() => {
          clientScrollToBottom();
        }, 500);
      } else if (chatSession.messages.length > 10) {
        setIsFetchingChatMessages(false);
        setTimeout(() => {
          clientScrollToBottom(true);
        }, 500);
      }

      setIsFetchingChatMessages(false);

      // if this is a seeded chat, then kick off the AI message generation
      if (
        newMessageHistory.length === 1 &&
        !submitOnLoadPerformed.current &&
        searchParams.get(SEARCH_PARAM_NAMES.SEEDED) === "true"
      ) {
        submitOnLoadPerformed.current = true;
        const seededMessage = newMessageHistory[0].message;
        await onSubmit({
          isSeededChat: true,
          messageOverride: seededMessage,
        });
        // force re-name if the chat session doesn't have one
        if (!chatSession.description) {
          await nameChatSession(existingChatSessionId, seededMessage);
          refreshChatSessions(teamspaceId);
        }
      }
    }

    initialSessionFetch();
  }, [existingChatSessionId]);

  const [message, setMessage] = useState(
    searchParams.get(SEARCH_PARAM_NAMES.USER_PROMPT) || ""
  );

  const [completeMessageDetail, setCompleteMessageDetail] = useState<
    Map<number | null, Map<number, Message>>
  >(new Map());

  const updateCompleteMessageDetail = (
    sessionId: number | null,
    messageMap: Map<number, Message>
  ) => {
    setCompleteMessageDetail((prevState) => {
      const newState = new Map(prevState);
      newState.set(sessionId, messageMap);
      return newState;
    });
  };

  const currentMessageMap = (
    messageDetail: Map<number | null, Map<number, Message>>
  ) => {
    return (
      messageDetail.get(chatSessionIdRef.current) || new Map<number, Message>()
    );
  };
  const currentSessionId = (): number => {
    return chatSessionIdRef.current!;
  };

  const upsertToCompleteMessageMap = ({
    messages,
    completeMessageMapOverride,
    chatSessionId,
    replacementsMap = null,
    makeLatestChildMessage = false,
  }: {
    messages: Message[];
    // if calling this function repeatedly with short delay, stay may not update in time
    // and result in weird behavipr
    completeMessageMapOverride?: Map<number, Message> | null;
    chatSessionId?: number;
    replacementsMap?: Map<number, number> | null;
    makeLatestChildMessage?: boolean;
  }) => {
    // deep copy
    const frozenCompleteMessageMap =
      completeMessageMapOverride || currentMessageMap(completeMessageDetail);
    const newCompleteMessageMap = structuredClone(frozenCompleteMessageMap);

    if (newCompleteMessageMap.size === 0) {
      const systemMessageId = messages[0].parentMessageId || SYSTEM_MESSAGE_ID;
      const firstMessageId = messages[0].messageId;
      const dummySystemMessage: Message = {
        messageId: systemMessageId,
        message: "",
        type: "system",
        files: [],
        toolCalls: [],
        parentMessageId: null,
        childrenMessageIds: [firstMessageId],
        latestChildMessageId: firstMessageId,
      };
      newCompleteMessageMap.set(
        dummySystemMessage.messageId,
        dummySystemMessage
      );
      messages[0].parentMessageId = systemMessageId;
    }

    messages.forEach((message) => {
      const idToReplace = replacementsMap?.get(message.messageId);
      if (idToReplace) {
        removeMessage(idToReplace, newCompleteMessageMap);
      }

      // update childrenMessageIds for the parent
      if (
        !newCompleteMessageMap.has(message.messageId) &&
        message.parentMessageId !== null
      ) {
        updateParentChildren(message, newCompleteMessageMap, true);
      }
      newCompleteMessageMap.set(message.messageId, message);
    });
    // if specified, make these new message the latest of the current message chain
    if (makeLatestChildMessage) {
      const currentMessageChain = buildLatestMessageChain(
        frozenCompleteMessageMap
      );
      const latestMessage = currentMessageChain[currentMessageChain.length - 1];
      if (latestMessage) {
        newCompleteMessageMap.get(
          latestMessage.messageId
        )!.latestChildMessageId = messages[0].messageId;
      }
    }

    const newCompleteMessageDetail = {
      sessionId: chatSessionId || currentSessionId(),
      messageMap: newCompleteMessageMap,
    };

    updateCompleteMessageDetail(
      chatSessionId || currentSessionId(),
      newCompleteMessageMap
    );
    return newCompleteMessageDetail;
  };

  const messageHistory = buildLatestMessageChain(
    currentMessageMap(completeMessageDetail)
  );

  const [submittedMessage, setSubmittedMessage] = useState("");

  const [chatState, setChatState] = useState<Map<number | null, ChatState>>(
    new Map([[chatSessionIdRef.current, "input"]])
  );

  const [regenerationState, setRegenerationState] = useState<
    Map<number | null, RegenerationState | null>
  >(new Map([[null, null]]));

  const [abortControllers, setAbortControllers] = useState<
    Map<number | null, AbortController>
  >(new Map());

  // Updates "null" session values to new session id for
  // regeneration, chat, and abort controller state, messagehistory
  const updateStatesWithNewSessionId = (newSessionId: number) => {
    const updateState = (
      setState: Dispatch<SetStateAction<Map<number | null, any>>>,
      defaultValue?: any
    ) => {
      setState((prevState) => {
        const newState = new Map(prevState);
        const existingState = newState.get(null);
        if (existingState !== undefined) {
          newState.set(newSessionId, existingState);
          newState.delete(null);
        } else if (defaultValue !== undefined) {
          newState.set(newSessionId, defaultValue);
        }
        return newState;
      });
    };

    updateState(setRegenerationState);
    updateState(setChatState);
    updateState(setAbortControllers);

    // Update completeMessageDetail
    setCompleteMessageDetail((prevState) => {
      const newState = new Map(prevState);
      const existingMessages = newState.get(null);
      if (existingMessages) {
        newState.set(newSessionId, existingMessages);
        newState.delete(null);
      }
      return newState;
    });

    // Update chatSessionIdRef
    chatSessionIdRef.current = newSessionId;
  };

  const updateChatState = (newState: ChatState, sessionId?: number | null) => {
    setChatState((prevState) => {
      const newChatState = new Map(prevState);
      newChatState.set(
        sessionId !== undefined ? sessionId : currentSessionId(),
        newState
      );
      return newChatState;
    });
  };

  const currentChatState = (): ChatState => {
    return chatState.get(currentSessionId()) || "input";
  };

  const currentChatAnswering = () => {
    return (
      currentChatState() == "toolBuilding" ||
      currentChatState() == "streaming" ||
      currentChatState() == "loading"
    );
  };

  const updateRegenerationState = (
    newState: RegenerationState | null,
    sessionId?: number | null
  ) => {
    setRegenerationState((prevState) => {
      const newRegenerationState = new Map(prevState);
      newRegenerationState.set(
        sessionId !== undefined ? sessionId : currentSessionId(),
        newState
      );
      return newRegenerationState;
    });
  };

  const resetRegenerationState = (sessionId?: number | null) => {
    updateRegenerationState(null, sessionId);
  };

  const currentRegenerationState = (): RegenerationState | null => {
    return regenerationState.get(currentSessionId()) || null;
  };
  const [canContinue, setCanContinue] = useState<Map<number | null, boolean>>(
    new Map([[null, false]])
  );

  const updateCanContinue = (newState: boolean, sessionId?: number | null) => {
    setCanContinue((prevState) => {
      const newCanContinueState = new Map(prevState);
      newCanContinueState.set(
        sessionId !== undefined ? sessionId : currentSessionId(),
        newState
      );
      return newCanContinueState;
    });
  };

  const currentCanContinue = (): boolean => {
    return canContinue.get(currentSessionId()) || false;
  };

  const currentSessionChatState = currentChatState();
  const currentSessionRegenerationState = currentRegenerationState();

  // uploaded files
  const [currentMessageFiles, setCurrentMessageFiles] = useState<
    FileDescriptor[]
  >([]);

  // for document display
  // NOTE: -1 is a special designation that means the latest AI message
  const [selectedMessageForDocDisplay, setSelectedMessageForDocDisplay] =
    useState<number | null>(null);
  const { aiMessage } = selectedMessageForDocDisplay
    ? getHumanAndAIMessageFromMessageNumber(
        messageHistory,
        selectedMessageForDocDisplay
      )
    : { aiMessage: null };

  const [chatSessionSharedStatus, setChatSessionSharedStatus] =
    useState<ChatSessionSharedStatus>(ChatSessionSharedStatus.Private);

  useEffect(() => {
    if (messageHistory.length === 0 && chatSessionIdRef.current === null) {
      setSelectedAssistant(
        availableAssistants.find(
          (assistant: Assistant) => assistant.id === defaultAssistantId
        )
      );
    }
  }, [defaultAssistantId, availableAssistants, messageHistory.length]);

  // future feature / to be removed
  const [
    selectedDocuments,
    toggleDocumentSelection,
    clearSelectedDocuments,
    selectedDocumentTokens,
  ] = useDocumentSelection();
  // just choose a conservative default, this will be updated in the
  // background on initial load / on assistant change
  const [maxTokens, setMaxTokens] = useState<number>(4096);

  // fetch # of allowed document tokens for the selected Assistant
  useEffect(() => {
    async function fetchMaxTokens() {
      const response = await fetch(
        `/api/chat/max-selected-document-tokens?assistant_id=${liveAssistant.id}`
      );
      if (response.ok) {
        const maxTokens = (await response.json()).max_tokens as number;
        setMaxTokens(maxTokens);
      }
    }

    fetchMaxTokens();
  }, [liveAssistant]);

  const filterManager = useFilters();
  const [finalAvailableSources, finalAvailableDocumentSets] =
    computeAvailableFilters({
      selectedAssistant: selectedAssistant,
      availableSources,
      availableDocumentSets,
    });

  const [currentFeedback, setCurrentFeedback] = useState<
    [FeedbackType, number] | null
  >(null);

  const [sharingModalVisible, setSharingModalVisible] =
    useState<boolean>(false);

  const [aboveHorizon, setAboveHorizon] = useState(false);

  const scrollableDivRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const endDivRef = useRef<HTMLDivElement>(null);
  const endPaddingRef = useRef<HTMLDivElement>(null);

  const previousHeight = useRef<number>(
    inputRef.current?.getBoundingClientRect().height!
  );
  const scrollDist = useRef<number>(0);

  const updateScrollTracking = () => {
    const scrollDistance =
      endDivRef?.current?.getBoundingClientRect()?.top! -
      inputRef?.current?.getBoundingClientRect()?.top!;
    scrollDist.current = scrollDistance;
    setAboveHorizon(scrollDist.current > 500);
  };

  useEffect(() => {
    const scrollableDiv = scrollableDivRef.current;
    if (scrollableDiv) {
      scrollableDiv.addEventListener("scroll", updateScrollTracking);
      return () => {
        scrollableDiv.removeEventListener("scroll", updateScrollTracking);
      };
    }
  }, []);

  const handleInputResize = () => {
    setTimeout(() => {
      if (inputRef.current && lastMessageRef.current) {
        let newHeight: number =
          inputRef.current?.getBoundingClientRect().height!;
        const heightDifference = newHeight - previousHeight.current;
        if (
          previousHeight.current &&
          heightDifference != 0 &&
          endPaddingRef.current &&
          scrollableDivRef &&
          scrollableDivRef.current
        ) {
          endPaddingRef.current.style.transition = "height 0.3s ease-out";
          endPaddingRef.current.style.height = `${Math.max(
            newHeight - 50,
            0
          )}px`;

          scrollableDivRef?.current.scrollBy({
            left: 0,
            top: Math.max(heightDifference, 0),
            behavior: "smooth",
          });
        }
        previousHeight.current = newHeight;
      }
    }, 100);
  };

  const clientScrollToBottom = (fast?: boolean) => {
    setTimeout(() => {
      if (!endDivRef.current || !scrollableDivRef.current) {
        return;
      }

      const rect = endDivRef.current.getBoundingClientRect();
      const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

      if (isVisible) return;

      // Check if all messages are currently rendered
      if (currentVisibleRange.end < messageHistory.length) {
        // Update visible range to include the last messages
        updateCurrentVisibleRange({
          start: Math.max(
            0,
            messageHistory.length -
              (currentVisibleRange.end - currentVisibleRange.start)
          ),
          end: messageHistory.length,
          mostVisibleMessageId: currentVisibleRange.mostVisibleMessageId,
        });

        // Wait for the state update and re-render before scrolling
        setTimeout(() => {
          endDivRef.current?.scrollIntoView({
            behavior: (fast ? "instant" : "smooth") as any,
          });
          setHasPerformedInitialScroll(true);
        }, 0);
      } else {
        // If all messages are already rendered, scroll immediately
        endDivRef.current.scrollIntoView({
          behavior: (fast ? "instant" : "smooth") as any,
        });
        setHasPerformedInitialScroll(true);
      }
    }, 50);
  };

  const distance = 500; // distance that should "engage" the scroll
  const debounceNumber = 100; // time for debouncing

  const [hasPerformedInitialScroll, setHasPerformedInitialScroll] = useState(
    existingChatSessionId === null
  );

  // handle re-sizing of the text area
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    handleInputResize();
  }, [message]);

  // tracks scrolling
  useEffect(() => {
    updateScrollTracking();
  }, [messageHistory]);

  // used for resizing of the document sidebar
  const masterFlexboxRef = useRef<HTMLDivElement>(null);
  const [maxDocumentSidebarWidth, setMaxDocumentSidebarWidth] = useState<
    number | null
  >(null);

  const adjustDocumentSidebarWidth = () => {
    if (masterFlexboxRef.current && document.documentElement.clientWidth) {
      if (document.documentElement.clientWidth > 1700) {
        setMaxDocumentSidebarWidth(450);
      } else if (document.documentElement.clientWidth > 1420) {
        setMaxDocumentSidebarWidth(350);
      } else {
        setMaxDocumentSidebarWidth(300);
      }
    }
  };

  useEffect(() => {
    adjustDocumentSidebarWidth(); // Adjust the width on initial render
    window.addEventListener("resize", adjustDocumentSidebarWidth); // Add resize event listener
    refreshUser();
    return () => {
      window.removeEventListener("resize", adjustDocumentSidebarWidth); // Cleanup the event listener
    };
  }, []);

  if (!documentSidebarInitialWidth && maxDocumentSidebarWidth) {
    documentSidebarInitialWidth = Math.min(700, maxDocumentSidebarWidth);
  }

  class CurrentMessageFIFO {
    private stack: PacketType[] = [];
    isComplete: boolean = false;
    error: string | null = null;

    push(packetBunch: PacketType) {
      this.stack.push(packetBunch);
    }

    nextPacket(): PacketType | undefined {
      return this.stack.shift();
    }

    isEmpty(): boolean {
      return this.stack.length === 0;
    }
  }

  async function updateCurrentMessageFIFO(
    stack: CurrentMessageFIFO,
    params: any
  ) {
    try {
      for await (const packet of sendMessage(params)) {
        if (params.signal?.aborted) {
          throw new Error("AbortError");
        }
        stack.push(packet);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.debug("Stream aborted");
        } else {
          stack.error = error.message;
        }
      } else {
        stack.error = String(error);
      }
    } finally {
      stack.isComplete = true;
    }
  }

  const resetInputBar = () => {
    setMessage("");
    setCurrentMessageFiles([]);
    if (endPaddingRef.current) {
      endPaddingRef.current.style.height = `95px`;
    }
  };

  const continueGenerating = () => {
    onSubmit({
      messageOverride:
        "Continue Generating (pick up exactly where you left off)",
    });
  };

  type NewType = RegenerationRequest;

  const onSubmit = async ({
    messageIdToResend,
    messageOverride,
    queryOverride,
    forceSearch,
    isSeededChat,
    alternativeAssistantOverride = null,
    modelOverRide,
    regenerationRequest,
  }: {
    messageIdToResend?: number;
    messageOverride?: string;
    queryOverride?: string;
    forceSearch?: boolean;
    isSeededChat?: boolean;
    alternativeAssistantOverride?: Assistant | null;
    modelOverRide?: LlmOverride;
    regenerationRequest?: NewType | null;
  } = {}) => {
    let frozenSessionId = currentSessionId();
    updateCanContinue(false, frozenSessionId);

    if (currentChatState() != "input") {
      toast({
        title: "Error",
        description: "Please wait for the response to complete",
        variant: "destructive",
      });

      return;
    }

    setAlternativeGeneratingAssistant(alternativeAssistantOverride);

    let currChatSessionId: number;
    let isNewSession = chatSessionIdRef.current === null;
    const searchParamBasedChatSessionName =
      searchParams.get(SEARCH_PARAM_NAMES.TITLE) || null;

    if (isNewSession) {
      currChatSessionId = await createChatSession(
        liveAssistant?.id || 0,
        searchParamBasedChatSessionName,
        teamspaceId
      );
    } else {
      currChatSessionId = chatSessionIdRef.current as number;
    }
    frozenSessionId = currChatSessionId;

    updateStatesWithNewSessionId(currChatSessionId);

    const controller = new AbortController();

    setAbortControllers((prev) =>
      new Map(prev).set(currChatSessionId, controller)
    );

    const messageToResend = messageHistory.find(
      (message) => message.messageId === messageIdToResend
    );

    updateRegenerationState(
      regenerationRequest
        ? { regenerating: true, finalMessageIndex: messageIdToResend || 0 }
        : null
    );
    const messageMap = currentMessageMap(completeMessageDetail);
    const messageToResendParent =
      messageToResend?.parentMessageId !== null &&
      messageToResend?.parentMessageId !== undefined
        ? messageMap.get(messageToResend.parentMessageId)
        : null;
    const messageToResendIndex = messageToResend
      ? messageHistory.indexOf(messageToResend)
      : null;

    if (!messageToResend && messageIdToResend !== undefined) {
      toast({
        title: "Message Resend Failed",
        description:
          "Failed to re-send message - please refresh the page and try again.",
        variant: "destructive",
      });
      resetRegenerationState(currentSessionId());
      updateChatState("input", frozenSessionId);
      return;
    }
    let currMessage = messageToResend ? messageToResend.message : message;
    if (messageOverride) {
      currMessage = messageOverride;
    }

    setSubmittedMessage(currMessage);

    updateChatState("loading");

    const currMessageHistory =
      messageToResendIndex !== null
        ? messageHistory.slice(0, messageToResendIndex)
        : messageHistory;

    let parentMessage =
      messageToResendParent ||
      (currMessageHistory.length > 0
        ? currMessageHistory[currMessageHistory.length - 1]
        : null) ||
      (messageMap.size === 1 ? Array.from(messageMap.values())[0] : null);

    const currentAssistantId = alternativeAssistantOverride
      ? alternativeAssistantOverride.id
      : alternativeAssistant
        ? alternativeAssistant.id
        : liveAssistant.id;

    resetInputBar();
    let messageUpdates: Message[] | null = null;

    let answer = "";

    let stopReason: StreamStopReason | null = null;
    let query: string | null = null;
    let retrievalType: RetrievalType =
      selectedDocuments.length > 0
        ? RetrievalType.SelectedDocs
        : RetrievalType.None;
    let documents: EnmeddDocument[] = selectedDocuments;
    let aiMessageImages: FileDescriptor[] | null = null;
    let error: string | null = null;
    let stackTrace: string | null = null;

    let finalMessage: BackendMessage | null = null;
    let toolCalls: ToolCallMetadata[] = [];

    let initialFetchDetails: null | {
      user_message_id: number;
      assistant_message_id: number;
      frozenMessageMap: Map<number, Message>;
    } = null;

    try {
      const mapKeys = Array.from(
        currentMessageMap(completeMessageDetail).keys()
      );
      const systemMessage = Math.min(...mapKeys);

      const lastSuccessfulMessageId =
        getLastSuccessfulMessageId(currMessageHistory) || systemMessage;

      const stack = new CurrentMessageFIFO();
      updateCurrentMessageFIFO(stack, {
        signal: controller.signal, // Add this line
        message: currMessage,
        alternateAssistantId: currentAssistantId,
        fileDescriptors: currentMessageFiles,
        parentMessageId:
          regenerationRequest?.parentMessage.messageId ||
          lastSuccessfulMessageId,
        chatSessionId: currChatSessionId,
        promptId: liveAssistant?.prompts[0]?.id || 0,
        filters: buildFilters(
          filterManager.selectedSources,
          filterManager.selectedDocumentSets,
          filterManager.timeRange,
          filterManager.selectedTags
        ),
        selectedDocumentIds: selectedDocuments
          .filter(
            (document) =>
              document.db_doc_id !== undefined && document.db_doc_id !== null
          )
          .map((document) => document.db_doc_id as number),
        queryOverride,
        forceSearch,
        regenerate: regenerationRequest !== undefined,
        modelProvider:
          modelOverRide?.name ||
          llmOverrideManager.llmOverride.name ||
          llmOverrideManager.globalDefault.name ||
          undefined,
        modelVersion:
          modelOverRide?.modelName ||
          llmOverrideManager.llmOverride.modelName ||
          searchParams.get(SEARCH_PARAM_NAMES.MODEL_VERSION) ||
          llmOverrideManager.globalDefault.modelName ||
          undefined,
        temperature: llmOverrideManager.temperature || undefined,
        systemPromptOverride:
          searchParams.get(SEARCH_PARAM_NAMES.SYSTEM_PROMPT) || undefined,
        useExistingUserMessage: isSeededChat,
      });

      const delay = (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms));
      };

      await delay(50);
      while (!stack.isComplete || !stack.isEmpty()) {
        if (stack.isEmpty()) {
          await delay(0.5);
        }

        if (!stack.isEmpty() && !controller.signal.aborted) {
          const packet = stack.nextPacket();
          if (!packet) {
            continue;
          }

          if (!initialFetchDetails) {
            if (!Object.hasOwn(packet, "user_message_id")) {
              console.error(
                "First packet should contain message response info "
              );
              if (Object.hasOwn(packet, "error")) {
                const error = (packet as StreamingError).error;
                setLoadingError(error);
                updateChatState("input");
                return;
              }
              continue;
            }

            const messageResponseIDInfo = packet as MessageResponseIDInfo;

            const user_message_id = messageResponseIDInfo.user_message_id!;
            const assistant_message_id =
              messageResponseIDInfo.reserved_assistant_message_id;

            // we will use tempMessages until the regenerated message is complete
            messageUpdates = [
              {
                messageId: regenerationRequest
                  ? regenerationRequest?.parentMessage?.messageId!
                  : user_message_id,
                message: currMessage,
                type: "user",
                files: currentMessageFiles,
                toolCalls: [],
                parentMessageId: parentMessage?.messageId || SYSTEM_MESSAGE_ID,
              },
            ];

            if (parentMessage && !regenerationRequest) {
              messageUpdates.push({
                ...parentMessage,
                childrenMessageIds: (
                  parentMessage.childrenMessageIds || []
                ).concat([user_message_id]),
                latestChildMessageId: user_message_id,
              });
            }

            const { messageMap: currentFrozenMessageMap } =
              upsertToCompleteMessageMap({
                messages: messageUpdates,
                chatSessionId: currChatSessionId,
              });

            const frozenMessageMap = currentFrozenMessageMap;
            initialFetchDetails = {
              frozenMessageMap,
              assistant_message_id,
              user_message_id,
            };

            resetRegenerationState();
          } else {
            const { user_message_id, frozenMessageMap } = initialFetchDetails;

            setChatState((prevState) => {
              if (prevState.get(chatSessionIdRef.current!) === "loading") {
                return new Map(prevState).set(
                  chatSessionIdRef.current!,
                  "streaming"
                );
              }
              return prevState;
            });

            if (Object.hasOwn(packet, "answer_piece")) {
              answer += (packet as AnswerPiecePacket).answer_piece;
            } else if (Object.hasOwn(packet, "top_documents")) {
              documents = (packet as DocumentsResponse).top_documents;
              retrievalType = RetrievalType.Search;
              if (documents && documents.length > 0) {
                // point to the latest message (we don't know the messageId yet, which is why
                // we have to use -1)
                setSelectedMessageForDocDisplay(user_message_id);
              }
            } else if (Object.hasOwn(packet, "tool_name")) {
              toolCalls = [
                {
                  tool_name: (packet as ToolCallMetadata).tool_name,
                  tool_args: (packet as ToolCallMetadata).tool_args,
                  tool_result: (packet as ToolCallMetadata).tool_result,
                },
              ];
              if (
                !toolCalls[0].tool_result ||
                toolCalls[0].tool_result == undefined
              ) {
                updateChatState("toolBuilding", frozenSessionId);
              } else {
                updateChatState("streaming", frozenSessionId);
              }

              // This will be consolidated in upcoming tool calls udpate,
              // but for now, we need to set query as early as possible
              if (toolCalls[0].tool_name == SEARCH_TOOL_NAME) {
                query = toolCalls[0].tool_args["query"];
              }
            } else if (Object.hasOwn(packet, "file_ids")) {
              aiMessageImages = (packet as ImageGenerationDisplay).file_ids.map(
                (fileId) => {
                  return {
                    id: fileId,
                    type: ChatFileType.IMAGE,
                  };
                }
              );
            } else if (Object.hasOwn(packet, "error")) {
              error = (packet as StreamingError).error;
              stackTrace = (packet as StreamingError).stack_trace;
            } else if (Object.hasOwn(packet, "message_id")) {
              finalMessage = packet as BackendMessage;
            } else if (Object.hasOwn(packet, "stop_reason")) {
              const stop_reason = (packet as StreamStopInfo).stop_reason;
              if (stop_reason === StreamStopReason.CONTEXT_LENGTH) {
                updateCanContinue(true, frozenSessionId);
              }
            }

            // on initial message send, we insert a dummy system message
            // set this as the parent here if no parent is set
            parentMessage =
              parentMessage || frozenMessageMap?.get(SYSTEM_MESSAGE_ID)!;

            const updateFn = (messages: Message[]) => {
              const replacementsMap = regenerationRequest
                ? new Map([
                    [
                      regenerationRequest?.parentMessage?.messageId,
                      regenerationRequest?.parentMessage?.messageId,
                    ],
                    [
                      regenerationRequest?.messageId,
                      initialFetchDetails?.assistant_message_id,
                    ],
                  ] as [number, number][])
                : null;

              return upsertToCompleteMessageMap({
                messages: messages,
                replacementsMap: replacementsMap,
                completeMessageMapOverride: frozenMessageMap,
                chatSessionId: frozenSessionId!,
              });
            };

            updateFn([
              {
                messageId: regenerationRequest
                  ? regenerationRequest?.parentMessage?.messageId!
                  : initialFetchDetails.user_message_id!,
                message: currMessage,
                type: "user",
                files: currentMessageFiles,
                toolCalls: [],
                parentMessageId: error ? null : lastSuccessfulMessageId,
                childrenMessageIds: [
                  ...(regenerationRequest?.parentMessage?.childrenMessageIds ||
                    []),
                  initialFetchDetails.assistant_message_id!,
                ],
                latestChildMessageId: initialFetchDetails.assistant_message_id,
              },
              {
                messageId: initialFetchDetails.assistant_message_id!,
                message: error || answer,
                type: error ? "error" : "assistant",
                retrievalType,
                query: finalMessage?.rephrased_query || query,
                documents:
                  finalMessage?.context_docs?.top_documents || documents,
                citations: finalMessage?.citations || {},
                files: finalMessage?.files || aiMessageImages || [],
                toolCalls: finalMessage?.tool_calls || toolCalls,
                parentMessageId: regenerationRequest
                  ? regenerationRequest?.parentMessage?.messageId!
                  : initialFetchDetails.user_message_id,
                alternateAssistantID: alternativeAssistant?.id,
                stackTrace: stackTrace,
                overridden_model: finalMessage?.overridden_model,
                stopReason: stopReason,
              },
            ]);
          }
        }
        clientScrollToBottom(true);
      }
    } catch (e: any) {
      const errorMsg = e.message;
      upsertToCompleteMessageMap({
        messages: [
          {
            messageId:
              initialFetchDetails?.user_message_id || TEMP_USER_MESSAGE_ID,
            message: currMessage,
            type: "user",
            files: currentMessageFiles,
            toolCalls: [],
            parentMessageId: parentMessage?.messageId || SYSTEM_MESSAGE_ID,
          },
          {
            messageId:
              initialFetchDetails?.assistant_message_id ||
              TEMP_ASSISTANT_MESSAGE_ID,
            message: errorMsg,
            type: "error",
            files: aiMessageImages || [],
            toolCalls: [],
            parentMessageId:
              initialFetchDetails?.user_message_id || TEMP_USER_MESSAGE_ID,
          },
        ],
        completeMessageMapOverride: currentMessageMap(completeMessageDetail),
      });
    }
    resetRegenerationState(currentSessionId());

    updateChatState("input");
    if (isNewSession) {
      if (finalMessage) {
        setSelectedMessageForDocDisplay(finalMessage.message_id);
      }

      if (!searchParamBasedChatSessionName) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        await nameChatSession(currChatSessionId, currMessage);
        refreshChatSessions(teamspaceId);
      }

      // NOTE: don't switch pages if the user has navigated away from the chat
      if (
        currChatSessionId === chatSessionIdRef.current ||
        chatSessionIdRef.current === null
      ) {
        const newUrl = buildChatUrl(
          searchParams,
          currChatSessionId,
          null,
          false,
          teamspaceId
        );
        // newUrl is like /chat?chatId=10
        // current page is like /chat
        router.push(newUrl, { scroll: false });
      }
    }
    if (
      finalMessage?.context_docs &&
      finalMessage.context_docs.top_documents.length > 0 &&
      retrievalType === RetrievalType.Search
    ) {
      setSelectedMessageForDocDisplay(finalMessage.message_id);
    }
    setAlternativeGeneratingAssistant(null);
  };

  const onFeedback = async (
    messageId: number,
    feedbackType: FeedbackType,
    feedbackDetails: string,
    predefinedFeedback: string | undefined
  ) => {
    if (chatSessionIdRef.current === null) {
      return;
    }

    const response = await handleChatFeedback(
      messageId,
      feedbackType,
      feedbackDetails,
      predefinedFeedback
    );

    if (response.ok) {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for sharing your thoughts with us!",
        variant: "success",
      });
    } else {
      const responseJson = await response.json();
      const errorMsg = responseJson.detail || responseJson.message;
      toast({
        title: "Submission Failed",
        description: `We're sorry, but we couldn't submit your feedback: ${errorMsg}`,
        variant: "destructive",
      });
    }
  };

  const onAssistantChange = (assistant: Assistant | null) => {
    if (assistant && assistant.id !== liveAssistant.id) {
      // Abort the ongoing stream if it exists
      console.log("THIS IS BEEN CALLED");
      // if (currentSessionChatState != "input") {
      //   stopGenerating();
      //   resetInputBar();
      // }

      textAreaRef.current?.focus();
      router.push(
        buildChatUrl(searchParams, null, assistant.id, false, teamspaceId)
      );
    }
  };

  const handleImageUpload = (acceptedFiles: File[]) => {
    const [_, llmModel] = getFinalLLM(
      llmProviders,
      liveAssistant,
      llmOverrideManager.llmOverride
    );
    const llmAcceptsImages = checkLLMSupportsImageInput(llmModel);

    const imageFiles = acceptedFiles.filter((file) =>
      file.type.startsWith("image/")
    );
    if (imageFiles.length > 0 && !llmAcceptsImages) {
      toast({
        title: "Unsupported Input",
        description:
          "The current Assistant does not support image input. Please choose an assistant that has Vision capabilities.",
        variant: "destructive",
      });
      return;
    }

    const tempFileDescriptors = acceptedFiles.map((file) => ({
      id: uuidv4(),
      type: file.type.startsWith("image/")
        ? ChatFileType.IMAGE
        : ChatFileType.DOCUMENT,
      isUploading: true,
    }));

    // only show loading spinner for reasonably large files
    const totalSize = acceptedFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 50 * 1024) {
      setCurrentMessageFiles((prev) => [...prev, ...tempFileDescriptors]);
    }

    const removeTempFiles = (prev: FileDescriptor[]) => {
      return prev.filter(
        (file) => !tempFileDescriptors.some((newFile) => newFile.id === file.id)
      );
    };

    uploadFilesForChat(acceptedFiles).then(([files, error]) => {
      if (error) {
        setCurrentMessageFiles((prev) => removeTempFiles(prev));
        toast({
          title: "Upload Failed",
          description: `Unable to upload files: ${error}`,
          variant: "destructive",
        });
      } else {
        setCurrentMessageFiles((prev) => [...removeTempFiles(prev), ...files]);
      }
    });
  };

  // handle redirect if chat page is disabled
  // NOTE: this must be done here, in a client component since
  // settings are passed in via Context and therefore aren't
  // available in server-side components
  const settings = useContext(SettingsContext);
  const enterpriseSettings = settings?.workspaces;
  if (settings?.settings?.chat_page_enabled === false) {
    router.push("/search");
  }

  const [loadingError, setLoadingError] = useState<string | null>(null);

  useScrollonStream({
    chatState: currentSessionChatState,
    scrollableDivRef,
    scrollDist,
    endDivRef,
    distance,
    debounceNumber,
  });

  // Virtualization + Scrolling related effects and functions
  const scrollInitialized = useRef(false);
  interface VisibleRange {
    start: number;
    end: number;
    mostVisibleMessageId: number | null;
  }

  const [visibleRange, setVisibleRange] = useState<
    Map<number | null, VisibleRange>
  >(() => {
    const initialRange: VisibleRange = {
      start: 0,
      end: BUFFER_COUNT,
      mostVisibleMessageId: null,
    };
    return new Map([[chatSessionIdRef.current, initialRange]]);
  });

  // Function used to update current visible range. Only method for updating `visibleRange` state.
  const updateCurrentVisibleRange = (
    newRange: VisibleRange,
    forceUpdate?: boolean
  ) => {
    if (
      scrollInitialized.current &&
      visibleRange.get(loadedIdSessionRef.current) == undefined &&
      !forceUpdate
    ) {
      return;
    }

    setVisibleRange((prevState) => {
      const newState = new Map(prevState);
      newState.set(loadedIdSessionRef.current, newRange);
      return newState;
    });
  };

  //  Set first value for visibleRange state on page load / refresh.
  const initializeVisibleRange = () => {
    const upToDatemessageHistory = buildLatestMessageChain(
      currentMessageMap(completeMessageDetail)
    );

    if (!scrollInitialized.current && upToDatemessageHistory.length > 0) {
      const newEnd = Math.max(upToDatemessageHistory.length, BUFFER_COUNT);
      const newStart = Math.max(0, newEnd - BUFFER_COUNT);
      const newMostVisibleMessageId =
        upToDatemessageHistory[newEnd - 1]?.messageId;

      updateCurrentVisibleRange(
        {
          start: newStart,
          end: newEnd,
          mostVisibleMessageId: newMostVisibleMessageId,
        },
        true
      );
      scrollInitialized.current = true;
    }
  };

  const updateVisibleRangeBasedOnScroll = () => {
    if (!scrollInitialized.current) return;
    const scrollableDiv = scrollableDivRef.current;
    if (!scrollableDiv) return;

    const viewportHeight = scrollableDiv.clientHeight;
    let mostVisibleMessageIndex = -1;

    messageHistory.forEach((message, index) => {
      const messageElement = document.getElementById(
        `message-${message.messageId}`
      );
      if (messageElement) {
        const rect = messageElement.getBoundingClientRect();
        const isVisible = rect.bottom <= viewportHeight && rect.bottom > 0;
        if (isVisible && index > mostVisibleMessageIndex) {
          mostVisibleMessageIndex = index;
        }
      }
    });

    if (mostVisibleMessageIndex !== -1) {
      const startIndex = Math.max(0, mostVisibleMessageIndex - BUFFER_COUNT);
      const endIndex = Math.min(
        messageHistory.length,
        mostVisibleMessageIndex + BUFFER_COUNT + 1
      );

      updateCurrentVisibleRange({
        start: startIndex,
        end: endIndex,
        mostVisibleMessageId: messageHistory[mostVisibleMessageIndex].messageId,
      });
    }
  };

  useEffect(() => {
    initializeVisibleRange();
  }, [router, messageHistory]);

  useLayoutEffect(() => {
    const handleScroll = () => {
      updateVisibleRangeBasedOnScroll();
    };
    scrollableDivRef.current?.addEventListener("scroll", handleScroll);

    return () => {
      scrollableDivRef.current?.removeEventListener("scroll", handleScroll);
    };
  }, [messageHistory]);

  const currentVisibleRange = visibleRange.get(currentSessionId()) || {
    start: 0,
    end: 0,
    mostVisibleMessageId: null,
  };

  useEffect(() => {
    if (noAssistants) {
      return;
    }
    const includes = checkAnyAssistantHasSearch(
      messageHistory,
      availableAssistants,
      liveAssistant
    );
    setRetrievalEnabled(includes);
  }, [messageHistory, availableAssistants, liveAssistant]);

  const [retrievalEnabled, setRetrievalEnabled] = useState(() => {
    if (noAssistants) {
      return false;
    }
    return checkAnyAssistantHasSearch(
      messageHistory,
      availableAssistants,
      liveAssistant
    );
  });

  const [stackTraceModalContent, setStackTraceModalContent] = useState<
    string | null
  >(null);

  const innerSidebarElementRef = useRef<HTMLDivElement>(null);
  const [settingsToggled, setSettingsToggled] = useState(false);

  const currentAssistant = alternativeAssistant || liveAssistant;

  interface RegenerationRequest {
    messageId: number;
    parentMessage: Message;
  }

  function createRegenerator(regenerationRequest: RegenerationRequest) {
    // Returns new function that only needs `modelOverRide` to be specified when called
    return async function (modelOverRide: LlmOverride) {
      return await onSubmit({
        modelOverRide,
        messageIdToResend: regenerationRequest.parentMessage.messageId,
        regenerationRequest,
      });
    };
  }
  const [showNoAssistantModal, setShowNoAssistantModal] =
    useState(noAssistants);

  const [open, setOpen] = useState(retrievalEnabled);
  useEffect(() => {
    setOpen(retrievalEnabled);
  }, [retrievalEnabled]);

  return (
    <SidebarProvider
      open={open}
      onOpenChange={setOpen}
      defaultOpen={open}
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
      className="h-full w-full"
    >
      <Inset
        open={retrievalEnabled}
        openFalse={() => setOpen(false)}
        openTrue={() => setOpen(true)}
      >
        {(toggleSidebar) => (
          <Sidebar
            user={user}
            sidebar={
              <ChatSidebar
                existingChats={chatSessions}
                currentChatSession={selectedChatSession}
                folders={folders}
                openedFolders={openedFolders}
                teamspaceId={teamspaceId}
                chatSessionIdRef={chatSessionIdRef}
              />
            }
          >
            <HealthCheckBanner />

            {showApiKeyModal && !shouldShowWelcomeModal ? (
              <ApiKeyModal
                hide={() => setShowApiKeyModal(false)}
                isOpen={showApiKeyModal && !shouldShowWelcomeModal}
              />
            ) : (
              showNoAssistantModal && (
                <NoAssistantModal
                  isAdmin={isAdmin}
                  open={showNoAssistantModal}
                  onClose={() => setShowNoAssistantModal(false)}
                />
              )
            )}

            {/* ChatPopup is a custom popup that displays a admin-specified message on initial user visit.
Only used in the EE version of the app. */}

            <ChatPopup />

            <div className="relative flex overflow-x-hidden bg-background default h-full">
              <div
                ref={masterFlexboxRef}
                className="flex w-full overflow-x-hidden"
              >
                {settingsToggled && (
                  <SetDefaultModelModal
                    setLlmOverride={llmOverrideManager.setGlobalDefault}
                    defaultModel={user?.preferences.default_model!}
                    llmProviders={llmProviders}
                    onClose={() => setSettingsToggled(false)}
                    settingsToggled={settingsToggled}
                  />
                )}

                {stackTraceModalContent && (
                  <ExceptionTraceModal
                    onOutsideClick={() => setStackTraceModalContent(null)}
                    exceptionTrace={stackTraceModalContent}
                    isOpen={!!stackTraceModalContent}
                  />
                )}

                {documentSidebarInitialWidth !== undefined &&
                isReady &&
                !isLoadingUser ? (
                  <Dropzone
                    key="enmedd-dropzone"
                    onDrop={handleImageUpload}
                    noClick
                  >
                    {({ getRootProps }) => (
                      <>
                        <div
                          className={`w-full sm:relative flex flex-col${
                            !retrievalEnabled ? "" : ""
                          }
                flex-auto transition-margin duration-300
                overflow-x-auto  overflow-y-auto
                `}
                          {...getRootProps()}
                        >
                          {/* <input {...getInputProps()} /> */}

                          {/* <HelperButton /> */}

                          {liveAssistant && (
                            <div className="relative shrink-0">
                              <div className="flex w-full items-center p-4 lg:px-0 3xl:px-4 justify-between min-h-16">
                                <div className="flex ml-auto gap-2 items-center pr-12 lg:pr-14 3xl:pr-12">
                                  {chatSessionIdRef.current !== null && (
                                    <FeatureFlagWrapper flag="share_chat">
                                      <ShareChatSessionModal
                                        chatSessionId={chatSessionIdRef.current}
                                        existingSharedStatus={
                                          chatSessionSharedStatus
                                        }
                                        onShare={(shared) =>
                                          setChatSessionSharedStatus(
                                            shared
                                              ? ChatSessionSharedStatus.Public
                                              : ChatSessionSharedStatus.Private
                                          )
                                        }
                                      />
                                    </FeatureFlagWrapper>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          <div
                            className="w-full h-full flex flex-col overflow-x-hidden relative scroll-smooth flex-1 pt-6 lg:pt-0 lg:px-10 3xl:px-0 "
                            ref={scrollableDivRef}
                          >
                            {/* ChatBanner is a custom banner that displays a admin-specified message at
                the top of the chat page. Only used in the EE version of the app. */}
                            {/*  <ChatBanner /> */}

                            {messageHistory.length === 0 &&
                              !isFetchingChatMessages &&
                              currentSessionChatState == "input" &&
                              !loadingError && (
                                <ChatIntro
                                  availableSources={finalAvailableSources}
                                  liveAssistant={liveAssistant}
                                  user={user}
                                >
                                  {currentAssistant &&
                                    currentAssistant.starter_messages &&
                                    currentAssistant.starter_messages.length >
                                      0 &&
                                    messageHistory.length === 0 &&
                                    !isFetchingChatMessages && (
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 md:pt-8">
                                        {currentAssistant.starter_messages.map(
                                          (
                                            starterMessage: StarterMessageType,
                                            i: number
                                          ) => (
                                            <div
                                              key={i}
                                              className={`w-full ${
                                                i > 1 ? "hidden md:flex" : ""
                                              }`}
                                            >
                                              <StarterMessage
                                                starterMessage={starterMessage}
                                                onClick={() =>
                                                  onSubmit({
                                                    messageOverride:
                                                      starterMessage.message,
                                                  })
                                                }
                                              />
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                </ChatIntro>
                              )}
                            <div
                              className={`pb-10 md:pb-14 lg:pb-16 px-5 md:px-8 lg:px-5 2xl:px-0 max-w-full mx-auto 2xl:w-searchbar w-full
                  } ${messageHistory.length === 0 ? "hidden" : "block"}`}
                            >
                              {(messageHistory.length < BUFFER_COUNT
                                ? messageHistory
                                : messageHistory.slice(
                                    currentVisibleRange.start,
                                    currentVisibleRange.end
                                  )
                              ).map((message, fauxIndex) => {
                                const i =
                                  messageHistory.length < BUFFER_COUNT
                                    ? fauxIndex
                                    : fauxIndex + currentVisibleRange.start;

                                const messageMap = currentMessageMap(
                                  completeMessageDetail
                                );
                                const messageReactComponentKey = `${i}-${currentSessionId()}`;
                                const parentMessage = message.parentMessageId
                                  ? messageMap.get(message.parentMessageId)
                                  : null;
                                if (message.type === "user") {
                                  if (
                                    (currentSessionChatState == "loading" &&
                                      i == messageHistory.length - 1) ||
                                    (currentSessionRegenerationState?.regenerating &&
                                      message.messageId >=
                                        currentSessionRegenerationState?.finalMessageIndex!)
                                  ) {
                                    return <></>;
                                  }
                                  return (
                                    <div
                                      id={`message-${message.messageId}`}
                                      key={messageReactComponentKey}
                                    >
                                      <HumanMessage
                                        user={user}
                                        stopGenerating={stopGenerating}
                                        content={message.message}
                                        files={message.files}
                                        messageId={message.messageId}
                                        onEdit={(editedContent) => {
                                          const parentMessageId =
                                            message.parentMessageId!;
                                          const parentMessage =
                                            messageMap.get(parentMessageId)!;
                                          upsertToCompleteMessageMap({
                                            messages: [
                                              {
                                                ...parentMessage,
                                                latestChildMessageId: null,
                                              },
                                            ],
                                          });
                                          onSubmit({
                                            messageIdToResend:
                                              message.messageId || undefined,
                                            messageOverride: editedContent,
                                          });
                                        }}
                                        otherMessagesCanSwitchTo={
                                          parentMessage?.childrenMessageIds ||
                                          []
                                        }
                                        onMessageSelection={(messageId) => {
                                          const newCompleteMessageMap = new Map(
                                            messageMap
                                          );
                                          newCompleteMessageMap.get(
                                            message.parentMessageId!
                                          )!.latestChildMessageId = messageId;
                                          updateCompleteMessageDetail(
                                            currentSessionId(),
                                            newCompleteMessageMap
                                          );
                                          setSelectedMessageForDocDisplay(
                                            messageId
                                          );
                                          // set message as latest so we can edit this message
                                          // and so it sticks around on page reload
                                          setMessageAsLatest(messageId);
                                        }}
                                      />
                                    </div>
                                  );
                                } else if (message.type === "assistant") {
                                  const isShowingRetrieved =
                                    (selectedMessageForDocDisplay !== null &&
                                      selectedMessageForDocDisplay ===
                                        message.messageId) ||
                                    (selectedMessageForDocDisplay ===
                                      TEMP_USER_MESSAGE_ID &&
                                      i === messageHistory.length - 1);
                                  const previousMessage =
                                    i !== 0 ? messageHistory[i - 1] : null;

                                  const currentAlternativeAssistant =
                                    message.alternateAssistantID != null
                                      ? availableAssistants.find(
                                          (assistant) =>
                                            assistant.id ==
                                            message.alternateAssistantID
                                        )
                                      : null;

                                  if (
                                    (currentSessionChatState == "loading" &&
                                      i > messageHistory.length - 1) ||
                                    (currentSessionRegenerationState?.regenerating &&
                                      message.messageId >
                                        currentSessionRegenerationState?.finalMessageIndex!)
                                  ) {
                                    return <></>;
                                  }
                                  return (
                                    <div
                                      id={`message-${message.messageId}`}
                                      key={messageReactComponentKey}
                                      ref={
                                        i == messageHistory.length - 1
                                          ? lastMessageRef
                                          : null
                                      }
                                    >
                                      <AIMessage
                                        continueGenerating={
                                          i == messageHistory.length - 1 &&
                                          currentCanContinue()
                                            ? continueGenerating
                                            : undefined
                                        }
                                        overriddenModel={
                                          message.overridden_model
                                        }
                                        regenerate={createRegenerator({
                                          messageId: message.messageId,
                                          parentMessage: parentMessage!,
                                        })}
                                        otherMessagesCanSwitchTo={
                                          parentMessage?.childrenMessageIds ||
                                          []
                                        }
                                        onMessageSelection={(messageId) => {
                                          const newCompleteMessageMap = new Map(
                                            messageMap
                                          );
                                          newCompleteMessageMap.get(
                                            message.parentMessageId!
                                          )!.latestChildMessageId = messageId;

                                          updateCompleteMessageDetail(
                                            currentSessionId(),
                                            newCompleteMessageMap
                                          );

                                          setSelectedMessageForDocDisplay(
                                            messageId
                                          );
                                          // set message as latest so we can edit this message
                                          // and so it sticks around on page reload
                                          setMessageAsLatest(messageId);
                                        }}
                                        isActive={
                                          messageHistory.length - 1 == i
                                        }
                                        selectedDocuments={selectedDocuments}
                                        docs={message.documents}
                                        currentAssistant={liveAssistant}
                                        alternativeAssistant={
                                          currentAlternativeAssistant
                                        }
                                        messageId={message.messageId}
                                        content={message.message}
                                        // content={message.message}
                                        files={message.files}
                                        query={
                                          messageHistory[i]?.query || undefined
                                        }
                                        assistantName={liveAssistant.name}
                                        citedDocuments={getCitedDocumentsFromMessage(
                                          message
                                        )}
                                        toolCall={
                                          message.toolCalls &&
                                          message.toolCalls[0]
                                        }
                                        isComplete={
                                          i !== messageHistory.length - 1 ||
                                          (currentSessionChatState !=
                                            "streaming" &&
                                            currentSessionChatState !=
                                              "toolBuilding")
                                        }
                                        hasDocs={
                                          (message.documents &&
                                            message.documents.length > 0) ===
                                          true
                                        }
                                        handleFeedback={
                                          i === messageHistory.length - 1 &&
                                          currentSessionChatState != "input"
                                            ? undefined
                                            : (feedbackType) =>
                                                setCurrentFeedback([
                                                  feedbackType,
                                                  message.messageId as number,
                                                ])
                                        }
                                        handleSearchQueryEdit={
                                          i === messageHistory.length - 1 &&
                                          currentSessionChatState == "input"
                                            ? (newQuery) => {
                                                if (!previousMessage) {
                                                  toast({
                                                    title: "Edit Error",
                                                    description:
                                                      "Cannot edit query of the first message - please refresh the page and try again.",
                                                    variant: "destructive",
                                                  });
                                                  return;
                                                }
                                                if (
                                                  previousMessage.messageId ===
                                                  null
                                                ) {
                                                  toast({
                                                    title: "Pending Message",
                                                    description:
                                                      "Cannot edit query of a pending message - please wait a few seconds and try again.",
                                                    variant: "destructive",
                                                  });
                                                  return;
                                                }
                                                onSubmit({
                                                  messageIdToResend:
                                                    previousMessage.messageId,
                                                  queryOverride: newQuery,
                                                  alternativeAssistantOverride:
                                                    currentAlternativeAssistant,
                                                });
                                              }
                                            : undefined
                                        }
                                        isCurrentlyShowingRetrieved={
                                          settings?.isMobile
                                            ? false
                                            : isShowingRetrieved
                                        }
                                        handleToggleSideBar={() => {
                                          if (settings?.isMobile) {
                                            toggleSidebar();
                                          } else {
                                            !isShowingRetrieved
                                              ? setOpen(true)
                                              : setOpen(false);
                                          }
                                        }}
                                        handleShowRetrieved={(
                                          messageNumber
                                        ) => {
                                          if (settings?.isMobile) {
                                            if (!isShowingRetrieved) {
                                              setSelectedMessageForDocDisplay(
                                                null
                                              );
                                            } else {
                                              if (messageNumber !== null) {
                                                setSelectedMessageForDocDisplay(
                                                  messageNumber
                                                );
                                              } else {
                                                setSelectedMessageForDocDisplay(
                                                  -1
                                                );
                                              }
                                            }
                                          } else {
                                            if (isShowingRetrieved) {
                                              setSelectedMessageForDocDisplay(
                                                null
                                              );
                                            } else {
                                              if (messageNumber !== null) {
                                                setSelectedMessageForDocDisplay(
                                                  messageNumber
                                                );
                                              } else {
                                                setSelectedMessageForDocDisplay(
                                                  -1
                                                );
                                              }
                                            }
                                          }
                                        }}
                                        handleForceSearch={() => {
                                          if (
                                            previousMessage &&
                                            previousMessage.messageId
                                          ) {
                                            onSubmit({
                                              messageIdToResend:
                                                previousMessage.messageId,
                                              forceSearch: true,
                                              alternativeAssistantOverride:
                                                currentAlternativeAssistant,
                                            });
                                          } else {
                                            toast({
                                              title: "Force Search Error",
                                              description:
                                                "Failed to force search - please refresh the page and try again.",
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                        retrievalDisabled={
                                          currentAlternativeAssistant
                                            ? !assistantIncludesRetrieval(
                                                currentAlternativeAssistant!
                                              )
                                            : !retrievalEnabled
                                        }
                                        onSubmit={onFeedback}
                                        currentFeedback={currentFeedback}
                                        llmProviders={llmProviders}
                                      />
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div key={messageReactComponentKey}>
                                      <AIMessage
                                        currentAssistant={liveAssistant}
                                        messageId={message.messageId}
                                        assistantName={liveAssistant.name}
                                        content={
                                          <p className="text-red-700 text-sm my-auto">
                                            {message.message}
                                            {message.stackTrace && (
                                              <span
                                                onClick={() =>
                                                  setStackTraceModalContent(
                                                    message.stackTrace!
                                                  )
                                                }
                                                className="ml-2 cursor-pointer underline"
                                              >
                                                Show stack trace.
                                              </span>
                                            )}
                                          </p>
                                        }
                                      />
                                    </div>
                                  );
                                }
                              })}

                              {(currentSessionChatState == "loading" ||
                                (loadingError &&
                                  !currentSessionRegenerationState?.regenerating &&
                                  messageHistory[messageHistory.length - 1]
                                    ?.type != "user")) && (
                                <HumanMessage
                                  user={user}
                                  key={-2}
                                  messageId={-1}
                                  content={submittedMessage}
                                />
                              )}

                              {currentSessionChatState == "loading" && (
                                <div
                                  key={`${messageHistory.length}-${chatSessionIdRef.current}`}
                                >
                                  <AIMessage
                                    key={-3}
                                    currentAssistant={liveAssistant}
                                    alternativeAssistant={
                                      alternativeGeneratingAssistant ??
                                      alternativeAssistant
                                    }
                                    messageId={null}
                                    assistantName={liveAssistant.name}
                                    content={
                                      <div className="my-auto text-sm flex flex-col gap-1 pt-4">
                                        <Skeleton className="h-5 w-full" />
                                        <Skeleton className="h-5 w-full" />
                                        <Skeleton className="h-5 w-3/4" />
                                      </div>
                                    }
                                  />
                                </div>
                              )}

                              {loadingError && (
                                <div key={-1}>
                                  <AIMessage
                                    currentAssistant={liveAssistant}
                                    messageId={-1}
                                    assistantName={liveAssistant.name}
                                    content={
                                      <p className="text-red-700 text-sm my-auto">
                                        {loadingError}
                                      </p>
                                    }
                                  />
                                </div>
                              )}

                              {/* Some padding at the bottom so the search bar has space at the bottom to not cover the last message*/}

                              <div ref={endDivRef} />

                              <div ref={endDivRef} />
                            </div>
                          </div>
                          <div ref={inputRef} className="z-10 w-full">
                            {aboveHorizon && (
                              <CircleArrowDown
                                onClick={() => clientScrollToBottom(true)}
                                size={24}
                                className="absolute bottom-[calc(100%_+_16px)] left-1/2 -translate-x-1/2 pointer-events-auto !rounded-full cursor-pointer bg-background"
                              />
                            )}
                            <div className="w-full pb-4 md:pb-10 lg:pb-4 lg:px-10 3xl:px-0 ">
                              <ChatInputBar
                                showConfigureAPIKey={() =>
                                  setShowApiKeyModal(true)
                                }
                                chatState={currentSessionChatState}
                                stopGenerating={stopGenerating}
                                openModelSettings={() =>
                                  setSettingsToggled(true)
                                }
                                inputPrompts={userInputPrompts}
                                selectedDocuments={selectedDocuments}
                                // assistant stuff
                                assistantOptions={availableAssistants}
                                selectedAssistant={liveAssistant}
                                setSelectedAssistant={onAssistantChange}
                                setAlternativeAssistant={
                                  setAlternativeAssistant
                                }
                                alternativeAssistant={alternativeAssistant}
                                // end assistant stuff
                                message={message}
                                setMessage={setMessage}
                                onSubmit={onSubmit}
                                filterManager={filterManager}
                                llmOverrideManager={llmOverrideManager}
                                files={currentMessageFiles}
                                setFiles={setCurrentMessageFiles}
                                handleFileUpload={handleImageUpload}
                                textAreaRef={textAreaRef}
                                chatSessionId={chatSessionIdRef.current!}
                              />

                              {enterpriseSettings &&
                                enterpriseSettings.custom_lower_disclaimer_content && (
                                  <div className="mobile:hidden mt-4 flex items-center justify-center relative w-[95%] mx-auto">
                                    <div className="text-sm text-text-500 max-w-searchbar-max px-4 text-center">
                                      <MinimalMarkdown
                                        content={
                                          enterpriseSettings.custom_lower_disclaimer_content
                                        }
                                      />
                                    </div>
                                  </div>
                                )}
                              {enterpriseSettings &&
                                enterpriseSettings.use_custom_logotype && (
                                  <div className="hidden lg:block absolute right-0 bottom-0">
                                    <Image
                                      src="/api/workspace/logotype"
                                      alt="logotype"
                                      style={{ objectFit: "contain" }}
                                      className="w-fit h-8"
                                    />
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </Dropzone>
                ) : (
                  <div className="flex flex-col h-full mx-auto">
                    <div className="my-auto">
                      <InitializingLoader />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Sidebar>
        )}
      </Inset>

      <SidebarSidebar
        className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
        side="right"
      >
        <DocumentSidebar
          ref={innerSidebarElementRef}
          selectedMessage={aiMessage}
          selectedDocuments={selectedDocuments}
          clearSelectedDocuments={clearSelectedDocuments}
          selectedDocumentTokens={selectedDocumentTokens}
          maxTokens={maxTokens}
          isLoading={isFetchingChatMessages}
        />
      </SidebarSidebar>
    </SidebarProvider>
  );
}
