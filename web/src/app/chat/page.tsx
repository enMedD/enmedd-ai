import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { InstantSSRAutoRefresh } from "@/components/SSRAutoRefresh";
import { WelcomeModal } from "@/components/initialSetup/welcome/WelcomeModalWrapper";
import { ChatPage } from "./ChatPage";
import { NoCompleteSourcesModal } from "@/components/initialSetup/search/NoCompleteSourceModal";
import { fetchChatData } from "@/lib/chat/fetchChatData";
import { ChatProvider } from "@/context/ChatContext";

export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) {
  noStore();

  const data = await fetchChatData(searchParams);

  if ("redirect" in data) {
    redirect(data.redirect);
  }

  const {
    user,
    chatSessions,
    ccPairs,
    availableSources,
    documentSets,
    tags,
    llmProviders,
    folders,
    openedFolders,
    defaultAssistantId,
    finalDocumentSidebarInitialWidth,
    shouldShowWelcomeModal,
    userInputPrompts,
    shouldDisplaySourcesIncompleteModal,
  } = data;

  return (
    <>
      <InstantSSRAutoRefresh />
      {shouldShowWelcomeModal && <WelcomeModal user={user} />}
      {shouldDisplaySourcesIncompleteModal && (
        <NoCompleteSourcesModal ccPairs={ccPairs} userRole={user?.role} />
      )}

      <ChatProvider
        value={{
          chatSessions,
          availableSources,
          availableDocumentSets: documentSets,
          availableTags: tags,
          llmProviders,
          folders,
          openedFolders,
          userInputPrompts,
          shouldShowWelcomeModal,
          defaultAssistantId,
        }}
      >
        <div className="h-full overflow-hidden">
          <ChatPage
            documentSidebarInitialWidth={finalDocumentSidebarInitialWidth}
          />
        </div>
      </ChatProvider>
    </>
  );
}
