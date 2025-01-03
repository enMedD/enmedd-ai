"use client";

import { Assistant } from "@/app/admin/assistants/interfaces";
import { AssistantIcon } from "@/components/assistants/AssistantIcon";
import { User } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";
import { FiList, FiMinus, FiPlus } from "react-icons/fi";
import { AssistantsPageTitle } from "../AssistantsPageTitle";
import {
  addAssistantToList,
  removeAssistantFromList,
} from "@/lib/assistants/updateAssistantPreferences";
import { useRouter } from "next/navigation";
import { AssistantTools } from "../ToolsDisplay";
import { classifyAssistants } from "@/lib/assistants/utils";
import { Button } from "@tremor/react";
import { useToast } from "@/hooks/use-toast";

export function AssistantGalleryCard({
  assistant,
  user,
  selectedAssistant,
}: {
  assistant: Assistant;
  user: User | null;
  selectedAssistant: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  return (
    <div
      key={assistant.id}
      className="
				bg-background-emphasis
				rounded-lg
				shadow-md
				p-4
			"
    >
      <div className="flex items-center">
        <AssistantIcon assistant={assistant} />
        <h2
          className="
						text-xl
						font-semibold
						my-auto
						ml-2
						text-strong
						line-clamp-2
					"
        >
          {assistant.name}
        </h2>
        {user && (
          <div className="ml-auto">
            {selectedAssistant ? (
              <Button
                className="
									mr-2
									my-auto
									bg-background-700
									hover:bg-background-600
								"
                icon={FiMinus}
                onClick={async () => {
                  if (
                    user.preferences?.chosen_assistants &&
                    user.preferences?.chosen_assistants.length === 1
                  ) {
                    toast({
                      title: "Action Not Allowed",
                      description: `Cannot remove "${assistant.name}" - you must have at least one assistant.`,
                      variant: "destructive",
                    });
                    return;
                  }

                  const success = await removeAssistantFromList(assistant.id);
                  if (success) {
                    toast({
                      title: "Assistant Removed",
                      description: `"${assistant.name}" has been removed from your list.`,
                      variant: "success",
                    });
                    router.refresh();
                  } else {
                    toast({
                      title: "Removal Failed",
                      description: `"${assistant.name}" could not be removed from your list.`,
                      variant: "destructive",
                    });
                  }
                }}
                size="xs"
              >
                Deselect
              </Button>
            ) : (
              <Button
                className="
									mr-2
									my-auto
									bg-accent
									hover:bg-accent-hover
								"
                icon={FiPlus}
                onClick={async () => {
                  const success = await addAssistantToList(assistant.id);
                  if (success) {
                    toast({
                      title: "Assistant Added",
                      description: `"${assistant.name}" has been added to your list.`,
                      variant: "success",
                    });
                    router.refresh();
                  } else {
                    toast({
                      title: "Addition Failed",
                      description: `"${assistant.name}" could not be added to your list.`,
                      variant: "destructive",
                    });
                  }
                }}
                size="xs"
                color="green"
              >
                Add
              </Button>
            )}
          </div>
        )}
      </div>

      <p className="text-sm mt-2">{assistant.description}</p>
      <p className="text-subtle text-sm my-2">
        Author: {assistant.owner?.email || "Arnold AI"}
      </p>
      {assistant.tools.length > 0 && (
        <AssistantTools list assistant={assistant} />
      )}
    </div>
  );
}
export function AssistantsGallery({
  assistants,
  user,
}: {
  assistants: Assistant[];

  user: User | null;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { visibleAssistants, hiddenAssistants: _ } = classifyAssistants(
    user,
    assistants
  );

  const defaultAssistants = assistants
    .filter((assistant) => assistant.is_default_assistant)
    .filter(
      (assistant) =>
        assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assistant.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const nonDefaultAssistants = assistants
    .filter((assistant) => !assistant.is_default_assistant)
    .filter(
      (assistant) =>
        assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assistant.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <>
      <div className="mx-auto w-searchbar-xs 2xl:w-searchbar-sm 3xl:w-searchbar">
        <AssistantsPageTitle>Assistant Gallery</AssistantsPageTitle>

        <div className="grid grid-cols-2 gap-4 mt-4 mb-6">
          <Button
            onClick={() => router.push("/assistants/new")}
            className="w-full py-3 text-lg rounded-full bg-background-800 text-white hover:bg-background-800 transition duration-300 ease-in-out"
            icon={FiPlus}
          >
            Create New Assistant
          </Button>

          <Button
            onClick={() => router.push("/assistants/mine")}
            className="w-full hover:border-border-strong py-3 text-lg rounded-full bg-white border border-border shadow text-text-700 hover:bg-background-50 transition duration-300 ease-in-out"
            icon={FiList}
          >
            Your Assistants
          </Button>
        </div>

        <div className="mt-4 mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="Search assistants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full
                py-3
                px-4
                pl-10
                text-lg
                border-2
                border-background-strong
                rounded-full
                bg-background-50
                text-text-700
                placeholder-text-400
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500
                focus:border-transparent
                transition duration-300 ease-in-out
              "
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-text-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {defaultAssistants.length == 0 &&
          nonDefaultAssistants.length == 0 &&
          assistants.length != 0 && (
            <div className="text-text-500">
              No assistants found for this search
            </div>
          )}

        {defaultAssistants.length > 0 && (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-2 text-text-900">
                Default Assistants
              </h2>

              <h3 className="text-lg text-text-500">
                These are assistant created by your admins are and preferred.
              </h3>
            </section>
            <div
              className="
                  w-full
                  grid
                  grid-cols-2
                  gap-4
                  py-2
                "
            >
              {defaultAssistants.map((assistant) => (
                <AssistantGalleryCard
                  selectedAssistant={visibleAssistants.includes(assistant)}
                  key={assistant.id}
                  assistant={assistant}
                  user={user}
                />
              ))}
            </div>
          </>
        )}

        {nonDefaultAssistants.length > 0 && (
          <section className="mt-12 mb-8 flex flex-col gap-y-2">
            <div className="flex flex-col">
              <h2 className="text-2xl font-semibold text-text-900">
                Other Assistants
              </h2>
              <h3 className="text-lg text-text-500">
                These are community-contributed assistants.
              </h3>
            </div>

            <div
              className="
                  w-full
                  grid
                  grid-cols-2
                  gap-4
                  py-2
                "
            >
              {nonDefaultAssistants.map((assistant) => (
                <AssistantGalleryCard
                  selectedAssistant={visibleAssistants.includes(assistant)}
                  key={assistant.id}
                  assistant={assistant}
                  user={user}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
