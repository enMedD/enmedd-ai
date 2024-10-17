"use client";

import React, {
  Dispatch,
  SetStateAction,
  useLayoutEffect,
  useMemo,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BackendChatSession,
  BackendMessage,
  BUFFER_COUNT,
  ChatFileType,
  ChatSession,
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
import Cookies from "js-cookie";
import { HistorySidebar } from "./sessionSidebar/HistorySidebar";
import { Assistant } from "../admin/assistants/interfaces";
import { HealthCheckBanner } from "@/components/health/healthcheck";
import { InstantSSRAutoRefresh } from "@/components/SSRAutoRefresh";
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
import { useContext, useEffect, useRef, useState } from "react";
import { usePopup } from "@/components/admin/connectors/Popup";
import { SEARCH_PARAM_NAMES, shouldSubmitOnLoad } from "./searchParams";
import { useDocumentSelection } from "./useDocumentSelection";
import { LlmOverride, useFilters, useLlmOverride } from "@/lib/hooks";
import { computeAvailableFilters } from "@/lib/filters";
import { ChatState, FeedbackType, RegenerationState } from "./types";
import { DocumentSidebar } from "./documentSidebar/DocumentSidebar";
import { InitializingLoader } from "@/components/InitializingLoader";
import { FeedbackModal } from "./modal/FeedbackModal";
import { ShareChatSessionModal } from "./modal/ShareChatSessionModal";
import { ChatIntro } from "./ChatIntro";
import { AIMessage, HumanMessage } from "./message/Messages";
import { ThreeDots } from "react-loader-spinner";
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
  destructureValue,
  getFinalLLM,
  getLLMProviderOverrideForAssistant,
} from "@/lib/llm/utils";
import { ChatInputBar } from "./input/ChatInputBar";
import { ConfigurationModal } from "./modal/configuration/ConfigurationModal";
import { useChatContext } from "@/context/ChatContext";
import { v4 as uuidv4 } from "uuid";
import { orderAssistantsForUser } from "@/lib/assistants/orderAssistants";
import { ChatPopup } from "./ChatPopup";
import { ChatBanner } from "./ChatBanner";
import { SIDEBAR_WIDTH_CONST } from "@/lib/constants";

import ResizableSection from "@/components/resizable/ResizableSection";
import {
  CircleArrowDown,
  PanelLeftClose,
  PanelRightClose,
  Share,
} from "lucide-react";
import Image from "next/image";
import Logo from "../../../public/logo-brand.png";
import { Button } from "@/components/ui/button";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { AnimatePresence, motion } from "framer-motion";
import { ChatSidebar } from "./sessionSidebar/ChatSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CustomTooltip } from "@/components/CustomTooltip";
import { HelperFab } from "@/components/HelperFab";
import Prism from "prismjs";
import { classifyAssistants } from "@/lib/assistants/utils";
import { StarterMessage as StarterMessageType } from "../admin/assistants/interfaces";
import { SEARCH_TOOL_NAME } from "./tools/constants";

const TEMP_USER_MESSAGE_ID = -1;
const TEMP_ASSISTANT_MESSAGE_ID = -2;
const SYSTEM_MESSAGE_ID = -3;

export function ChatPage({
  documentSidebarInitialWidth,
  defaultSelectedAssistantsId,
}: {
  documentSidebarInitialWidth?: number;
  defaultSelectedAssistantsId?: number;
}) {
  const [configModalActiveTab, setConfigModalActiveTab] = useState<
    string | null
  >(null);
  let {
    user,
    chatSessions,
    availableSources,
    availableDocumentSets,
    availableAssistants,
    llmProviders,
    folders,
    openedFolders,
    defaultAssistantId,
    refreshChatSessions,
  } = useChatContext();

  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Assistants in order
  const { finalAssistants } = useMemo(() => {
    const { visibleAssistants, hiddenAssistants: _ } = classifyAssistants(
      user,
      availableAssistants
    );
    const finalAssistants = user
      ? orderAssistantsForUser(visibleAssistants, user)
      : visibleAssistants;
    return { finalAssistants };
  }, [user, availableAssistants]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // 1. default assistant is `enMedD AI`
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
          refreshChatSessions();
        }
      }
    }

    initialSessionFetch();
  }, [existingChatSessionId]);

  const [usedSidebarWidth, setUsedSidebarWidth] = useState<number>(
    documentSidebarInitialWidth || parseInt(SIDEBAR_WIDTH_CONST)
  );

  const updateSidebarWidth = (newWidth: number) => {
    setUsedSidebarWidth(newWidth);
    if (sidebarElementRef.current && innerSidebarElementRef.current) {
      sidebarElementRef.current.style.transition = "";
      sidebarElementRef.current.style.width = `${newWidth}px`;
      innerSidebarElementRef.current.style.width = `${newWidth}px`;
    }
  };

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
      // Select from available assistants so shared assistants appear.
      setSelectedAssistant(
        availableAssistants.find(
          (assistant) => assistant.id === defaultAssistantId
        )
      );
    }
  }, [defaultAssistantId, availableAssistants, messageHistory.length]);

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
      selectedAssistant,
      availableSources,
      availableDocumentSets,
    });

  const [currentFeedback, setCurrentFeedback] = useState<
    [FeedbackType, number] | null
  >(null);

  // state for cancelling streaming
  const [isCancelled, setIsCancelled] = useState(false);
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

  scrollableDivRef?.current?.addEventListener("scroll", updateScrollTracking);

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
      if (fast) {
        endDivRef.current?.scrollIntoView();
      } else {
        endDivRef.current?.scrollIntoView({ behavior: "smooth" });
      }

      setHasPerformedInitialScroll(true);
    }, 50);
  };

  const isCancelledRef = useRef<boolean>(isCancelled); // scroll is cancelled
  useEffect(() => {
    isCancelledRef.current = isCancelled;
  }, [isCancelled]);

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
    regenerationRequest?: RegenerationRequest | null;
  } = {}) => {
    let frozenSessionId = currentSessionId();
    updateCanContinue(false, frozenSessionId);

    if (currentChatState() != "input") {
      toast({
        title: "Please wait for the response to complete",
        description: "The LLM is still trying to complete its response",
        variant: "destructive",
      });

      return;
    }

    setAlternativeGeneratingAssistant(alternativeAssistantOverride);
    clientScrollToBottom();
    let currChatSessionId: number;
    const isNewSession = chatSessionIdRef.current === null;
    const searchParamBasedChatSessionName =
      searchParams.get(SEARCH_PARAM_NAMES.TITLE) || null;

    if (isNewSession) {
      currChatSessionId = await createChatSession(
        liveAssistant?.id || 0,
        searchParamBasedChatSessionName
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

    const stopReason: StreamStopReason | null = null;
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
        refreshChatSessions();
      }

      // NOTE: don't switch pages if the user has navigated away from the chat
      if (
        currChatSessionId === chatSessionIdRef.current ||
        chatSessionIdRef.current === null
      ) {
        const newUrl = buildChatUrl(searchParams, currChatSessionId, null);
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
      if (currentSessionChatState != "input") {
        stopGenerating();
        resetInputBar();
      }

      textAreaRef.current?.focus();
      router.push(buildChatUrl(searchParams, null, assistant.id));
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
  if (settings?.settings?.chat_page_enabled === false) {
    router.push("/search");
  }

  const windowWidth = window.innerWidth;
  const [isMobile, setIsMobile] = useState(windowWidth <= 1420);
  const [showDocSidebar, setShowDocSidebar] = useState(windowWidth >= 1420);
  const [isWide, setIsWide] = useState(windowWidth >= 1420);

  const [loadingError, setLoadingError] = useState<string | null>(null);

  const toggleSidebar = () => {
    if (sidebarElementRef.current) {
      sidebarElementRef.current.style.transition = "all 0.3s ease-in-out";

      sidebarElementRef.current.style.width = showDocSidebar ? "300px" : "0px";
    }

    setShowDocSidebar((prevState) => !prevState);
  };

  const sidebarElementRef = useRef<HTMLDivElement>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, messageHistory]);

  useLayoutEffect(() => {
    const scrollableDiv = scrollableDivRef.current;

    const handleScroll = () => {
      updateVisibleRangeBasedOnScroll();
    };

    scrollableDiv?.addEventListener("scroll", handleScroll);

    return () => {
      scrollableDiv?.removeEventListener("scroll", handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const [editingRetrievalEnabled, setEditingRetrievalEnabled] = useState(false);
  const innerSidebarElementRef = useRef<HTMLDivElement>(null);

  const currentAssistant = selectedAssistant || liveAssistant;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key.toLowerCase()) {
          case "e":
            event.preventDefault();
            toggleSidebar();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const updateSelectedAssistant = (newAssistant: Assistant | null) => {
    setSelectedAssistant(newAssistant);
    if (newAssistant) {
      setEditingRetrievalEnabled(assistantIncludesRetrieval(newAssistant));
    } else {
      setEditingRetrievalEnabled(false);
    }
  };

  const [openSidebar, setOpenSidebar] = useState(false);

  const toggleLeftSideBar = () => {
    setOpenSidebar((prevState) => !prevState);
  };

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

  return (
    <>
      <HealthCheckBanner />
      <InstantSSRAutoRefresh />

      {/* ChatPopup is a custom popup that displays a admin-specified message on initial user visit. 
      Only used in the EE version of the app. */}
      <ChatPopup />

      <div className="relative flex overflow-x-hidden bg-background ault h-full">
        <DynamicSidebar
          user={user}
          openSidebar={openSidebar}
          toggleLeftSideBar={toggleLeftSideBar}
        >
          <ChatSidebar
            existingChats={chatSessions}
            currentChatSession={selectedChatSession}
            folders={folders}
            openedFolders={openedFolders}
            toggleSideBar={toggleLeftSideBar}
          />
        </DynamicSidebar>

        <div ref={masterFlexboxRef} className="flex w-full overflow-x-hidden">
          <ConfigurationModal
            chatSessionId={chatSessionIdRef.current!}
            activeTab={configModalActiveTab}
            setActiveTab={setConfigModalActiveTab}
            onClose={() => setConfigModalActiveTab(null)}
            filterManager={filterManager}
            availableAssistants={availableAssistants}
            selectedAssistant={liveAssistant}
            setSelectedAssistant={onAssistantChange}
            llmProviders={llmProviders}
            llmOverrideManager={llmOverrideManager}
          />

          {documentSidebarInitialWidth !== undefined ? (
            <Dropzone onDrop={handleImageUpload} noClick>
              {({ getRootProps }) => (
                <>
                  <div
                    className={`w-full sm:relative flex flex-col lg:px-10 3xl:px-0 ${
                      !retrievalEnabled ? "" : ""
                    }
                      flex-auto transition-margin duration-300 
                      overflow-x-auto  overflow-y-auto
                      `}
                    {...getRootProps()}
                  >
                    {/* <input {...getInputProps()} /> */}

                    <HelperFab />

                    {liveAssistant && (
                      <div className="relative z-top-bar shrink-0">
                        <div className="flex w-full items-start p-4 justify-between">
                          <div className="flex lg:hidden items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={toggleLeftSideBar}
                            >
                              <PanelRightClose size={24} />
                            </Button>
                            <Image src={Logo} alt="Logo" width={112} />
                          </div>
                          <div className="flex ml-auto gap-2 items-center">
                            {chatSessionIdRef.current !== null && (
                              <ShareChatSessionModal
                                chatSessionId={chatSessionIdRef.current}
                                existingSharedStatus={chatSessionSharedStatus}
                                onShare={(shared) =>
                                  setChatSessionSharedStatus(
                                    shared
                                      ? ChatSessionSharedStatus.Public
                                      : ChatSessionSharedStatus.Private
                                  )
                                }
                              />
                            )}

                            {retrievalEnabled && (
                              <CustomTooltip
                                trigger={
                                  <Button
                                    onClick={toggleSidebar}
                                    variant="ghost"
                                    size="icon"
                                  >
                                    {showDocSidebar ? (
                                      <PanelRightClose size={24} />
                                    ) : (
                                      <PanelLeftClose size={24} />
                                    )}
                                  </Button>
                                }
                                asChild
                              >
                                {showDocSidebar ? "Hide Docs" : "Show Docs"}
                              </CustomTooltip>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div
                      className="w-full h-full flex flex-col overflow-x-hidden relative scroll-smooth flex-1"
                      ref={scrollableDivRef}
                    >
                      {/* ChatBanner is a custom banner that displays a admin-specified message at 
                      the top of the chat page. Only used in the EE version of the app. */}
                      {/*  <ChatBanner /> */}

                      {messageHistory.length === 0 &&
                        !isFetchingChatMessages &&
                        currentSessionChatState == "input" && (
                          <ChatIntro
                            availableSources={finalAvailableSources}
                            liveAssistant={liveAssistant}
                            user={user}
                          >
                            {currentAssistant &&
                              currentAssistant.starter_messages &&
                              currentAssistant.starter_messages.length > 0 &&
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
                        className={`pb-10 md:pb-14 lg:pb-16 px-5 md:px-8 lg:px-5 2xl:px-0 max-w-full mx-auto 2xl:w-searchbar w-full ${
                          hasPerformedInitialScroll ? "" : " invisible"
                        } ${messageHistory.length === 0 ? "hidden" : "block"}`}
                      >
                        {messageHistory.map((message, i) => {
                          const messageMap = completeMessageDetail.messageMap;
                          const messageReactComponentKey = `${i}-${completeMessageDetail.sessionId}`;
                          if (message.type === "user") {
                            const parentMessage = message.parentMessageId
                              ? messageMap.get(message.parentMessageId)
                              : null;
                            return (
                              <div key={messageReactComponentKey}>
                                <HumanMessage
                                  user={user}
                                  content={message.message}
                                  files={message.files}
                                  messageId={message.messageId}
                                  otherMessagesCanSwitchTo={
                                    parentMessage?.childrenMessageIds || []
                                  }
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
                                  onMessageSelection={(messageId) => {
                                    const newCompleteMessageMap = new Map(
                                      messageMap
                                    );
                                    newCompleteMessageMap.get(
                                      message.parentMessageId!
                                    )!.latestChildMessageId = messageId;
                                    setCompleteMessageDetail({
                                      sessionId:
                                        completeMessageDetail.sessionId,
                                      messageMap: newCompleteMessageMap,
                                    });
                                    setSelectedMessageForDocDisplay(messageId);
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
                                    (assistant: Assistant) =>
                                      assistant.id ==
                                      message.alternateAssistantID
                                  )
                                : null;

                            return (
                              <div
                                key={messageReactComponentKey}
                                ref={
                                  i == messageHistory.length - 1
                                    ? lastMessageRef
                                    : null
                                }
                              >
                                <AIMessage
                                  currentAssistant={liveAssistant}
                                  alternativeAssistant={
                                    currentAlternativeAssistant
                                  }
                                  messageId={message.messageId}
                                  content={message.message}
                                  files={message.files}
                                  query={messageHistory[i]?.query || undefined}
                                  assistantName={liveAssistant.name}
                                  citedDocuments={getCitedDocumentsFromMessage(
                                    message
                                  )}
                                  toolCall={
                                    message.toolCalls && message.toolCalls[0]
                                  }
                                  isComplete={
                                    i !== messageHistory.length - 1 ||
                                    !isStreaming
                                  }
                                  hasDocs={
                                    (message.documents &&
                                      message.documents.length > 0) === true
                                  }
                                  handleFeedback={
                                    i === messageHistory.length - 1 &&
                                    isStreaming
                                      ? undefined
                                      : (feedbackType) =>
                                          setCurrentFeedback([
                                            feedbackType,
                                            message.messageId as number,
                                          ])
                                  }
                                  currentFeedback={currentFeedback}
                                  onClose={() => setCurrentFeedback(null)}
                                  onSubmit={({
                                    message,
                                    predefinedFeedback,
                                  }) => {
                                    onFeedback(
                                      currentFeedback![1],
                                      currentFeedback![0],
                                      message,
                                      predefinedFeedback
                                    );
                                    setCurrentFeedback(null);
                                  }}
                                  handleSearchQueryEdit={
                                    i === messageHistory.length - 1 &&
                                    !isStreaming
                                      ? (newQuery) => {
                                          if (!previousMessage) {
                                            toast({
                                              title: "Editing Error",
                                              description:
                                                "You cannot edit the query of the first message. Please refresh the page and try again.",
                                              variant: "destructive",
                                            });
                                            return;
                                          }

                                          if (
                                            previousMessage.messageId === null
                                          ) {
                                            toast({
                                              title: "Pending Message",
                                              description:
                                                "You cannot edit the query of a pending message. Please wait a few seconds and try again.",
                                              variant: "destructive",
                                            });
                                            return;
                                          }
                                          onSubmit({
                                            messageIdToResend:
                                              previousMessage.messageId,
                                            queryOverride: newQuery,
                                            alternativeAssistant:
                                              currentAlternativeAssistant,
                                          });
                                        }
                                      : undefined
                                  }
                                  isCurrentlyShowingRetrieved={
                                    isShowingRetrieved
                                  }
                                  handleShowRetrieved={(messageNumber) => {
                                    if (isMobile) {
                                      if (!isShowingRetrieved) {
                                        setSelectedMessageForDocDisplay(null);
                                      } else {
                                        if (messageNumber !== null) {
                                          setSelectedMessageForDocDisplay(
                                            messageNumber
                                          );
                                        } else {
                                          setSelectedMessageForDocDisplay(-1);
                                        }
                                      }
                                    } else {
                                      if (isShowingRetrieved) {
                                        setSelectedMessageForDocDisplay(null);
                                      } else {
                                        if (messageNumber !== null) {
                                          setSelectedMessageForDocDisplay(
                                            messageNumber
                                          );
                                        } else {
                                          setSelectedMessageForDocDisplay(-1);
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
                                        alternativeAssistant:
                                          currentAlternativeAssistant,
                                      });
                                    } else {
                                      toast({
                                        title: "Force Search Failed",
                                        description:
                                          "Unable to initiate the force search. Please refresh the page and try again.",
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
                                  handleToggleSideBar={() => {
                                    if (isMobile) {
                                      setShowDocSidebar(isShowingRetrieved);
                                    } else {
                                      !isShowingRetrieved
                                        ? setShowDocSidebar(true)
                                        : setShowDocSidebar(false);
                                    }

                                    if (sidebarElementRef.current) {
                                      sidebarElementRef.current.style.transition =
                                        "width 0.3s ease-in-out";
                                    }
                                  }}
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
                                    <p className="my-auto text-sm text-red-700">
                                      {message.message}
                                    </p>
                                  }
                                />
                              </div>
                            );
                          }
                        })}
                        {isStreaming &&
                          messageHistory.length > 0 &&
                          messageHistory[messageHistory.length - 1].type ===
                            "user" && (
                            <div
                              key={`${messageHistory.length}-${chatSessionIdRef.current}`}
                            >
                              <AIMessage
                                currentAssistant={liveAssistant}
                                alternativeAssistant={
                                  alternativeGeneratingAssistant ??
                                  selectedAssistant
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
                                isStreaming={isStreaming}
                              />
                            </div>
                          )}

                        {/* Some padding at the bottom so the search bar has space at the bottom to not cover the last message*/}

                        <div ref={endDivRef}></div>

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
                      <div className="w-full pb-4 md:pb-10 lg:pb-4">
                        <ChatInputBar
                          onSetSelectedAssistant={(
                            alternativeAssistant: Assistant | null
                          ) => {
                            updateSelectedAssistant(alternativeAssistant);
                          }}
                          alternativeAssistant={selectedAssistant}
                          assistants={filteredAssistants}
                          message={message}
                          setMessage={setMessage}
                          onSubmit={onSubmit}
                          isStreaming={isStreaming}
                          setIsCancelled={setIsCancelled}
                          retrievalDisabled={
                            !assistantIncludesRetrieval(currentAssistant)
                          }
                          filterManager={filterManager}
                          llmOverrideManager={llmOverrideManager}
                          selectedAssistant={liveAssistant}
                          files={currentMessageFiles}
                          setFiles={setCurrentMessageFiles}
                          handleFileUpload={handleImageUpload}
                          setConfigModalActiveTab={setConfigModalActiveTab}
                          textAreaRef={textAreaRef}
                          activeTab={configModalActiveTab}
                        />
                      </div>
                    </div>
                  </div>

                  {retrievalEnabled || editingRetrievalEnabled ? (
                    <>
                      <AnimatePresence>
                        {showDocSidebar && (
                          <motion.div
                            className={`fixed w-full h-full bg-background-inverted bg-opacity-20 inset-0 z-overlay 2xl:hidden`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: showDocSidebar ? 1 : 0 }}
                            exit={{ opacity: 0 }}
                            transition={{
                              duration: 0.2,
                              opacity: { delay: showDocSidebar ? 0 : 0.3 },
                            }}
                            style={{
                              pointerEvents: showDocSidebar ? "auto" : "none",
                            }}
                            onClick={toggleSidebar}
                          />
                        )}
                      </AnimatePresence>

                      <div
                        ref={sidebarElementRef}
                        className={`fixed 2xl:relative top-0 right-0 z-overlay bg-background  flex-none overflow-y-hidden h-full ${
                          showDocSidebar ? "translate-x-0" : "translate-x-full"
                        }`}
                        style={{
                          width: showDocSidebar
                            ? Math.max(350, usedSidebarWidth)
                            : 0,
                        }}
                      >
                        <ResizableSection
                          updateSidebarWidth={updateSidebarWidth}
                          intialWidth={usedSidebarWidth}
                          minWidth={350}
                          maxWidth={maxDocumentSidebarWidth || undefined}
                        >
                          <DocumentSidebar
                            initialWidth={showDocSidebar ? usedSidebarWidth : 0}
                            ref={innerSidebarElementRef}
                            closeSidebar={() => toggleSidebar()}
                            selectedMessage={aiMessage}
                            selectedDocuments={selectedDocuments}
                            toggleDocumentSelection={toggleDocumentSelection}
                            clearSelectedDocuments={clearSelectedDocuments}
                            selectedDocumentTokens={selectedDocumentTokens}
                            maxTokens={maxTokens}
                            isLoading={isFetchingChatMessages}
                            showDocSidebar={showDocSidebar}
                            isWide={isWide}
                          />
                        </ResizableSection>
                      </div>
                    </>
                  ) : // Another option is to use a div with the width set to the initial width, so that the
                  // chat section appears in the same place as before
                  // <div style={documentSidebarInitialWidth ? {width: documentSidebarInitialWidth} : {}}></div>
                  null}
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
    </>
  );
}
