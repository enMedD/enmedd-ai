import { ChatProvider } from "@/context/ChatContext";
import { WelcomeModal } from "@/components/initialSetup/welcome/WelcomeModalWrapper";
import { fetchChatData } from "@/lib/chat/fetchChatData";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { AssistantsGallery } from "./AssistantsGallery";
import { ChatSidebar } from "@/app/chat/sessionSidebar/ChatSidebar";

export default async function GalleryPage({
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
    availableSources,
    documentSets,
    assistants,
    tags,
    llmProviders,
    folders,
    openedFolders,
    shouldShowWelcomeModal,
    userInputPrompts,
  } = data;

  return (
    <>
      {shouldShowWelcomeModal && <WelcomeModal user={user} />}

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
        }}
      >
        <div className="relative flex h-screen overflow-x-hidden bg-background">
          <ChatSidebar
            existingChats={chatSessions}
            currentChatSession={null}
            folders={folders}
            openedFolders={openedFolders}
            isAssistant
          />

          <div
            className={`w-full h-full flex flex-col overflow-y-auto overflow-x-hidden relative pt-24 px-4 2xl:pt-10`}
          >
            <AssistantsGallery assistants={assistants} user={user} />
          </div>
        </div>
      </ChatProvider>
    </>
  );
}
