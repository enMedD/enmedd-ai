"use client";

import React, {
  createContext,
  useState,
  useContext,
  useMemo,
  useEffect,
} from "react";
import { Assistant } from "@/app/admin/assistants/interfaces";
import {
  classifyAssistants,
  orderAssistantsForUser,
  getUserCreatedAssistants,
} from "@/lib/assistants/utils";
import { useUser } from "@/components/user/UserProvider";
import { useParams } from "next/navigation";

interface AssistantsContextProps {
  assistants: Assistant[];
  visibleAssistants: Assistant[];
  hiddenAssistants: Assistant[];
  finalAssistants: Assistant[];
  ownedButHiddenAssistants: Assistant[];
  refreshAssistants: () => Promise<void>;
}

const AssistantsContext = createContext<AssistantsContextProps | undefined>(
  undefined
);

export const AssistantsProvider: React.FC<{
  children: React.ReactNode;
  initialAssistants: Assistant[];
  hasAnyConnectors: boolean;
  hasImageCompatibleModel: boolean;
}> = ({
  children,
  initialAssistants,
  hasAnyConnectors,
  hasImageCompatibleModel,
}) => {
  const { teamspaceId } = useParams();
  const [assistants, setAssistants] = useState<Assistant[]>(
    initialAssistants || []
  );
  const { user } = useUser();

  const fetchAssistants = async () => {
    try {
      const response = await fetch(
        teamspaceId
          ? `/api/assistant?is_public=true&teamspace_id=${teamspaceId}`
          : "/api/assistant?is_public=true",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const allAssistants = await response.json();
        setAssistants(allAssistants);
      } else {
        console.error("Error fetching assistants:", response);
      }
    } catch (error) {
      console.error("Error fetching assistants:", error);
    }
  };

  useEffect(() => {
    fetchAssistants();
  }, [teamspaceId, user]);

  const refreshAssistants = async () => {
    try {
      const response = await fetch(
        teamspaceId
          ? `/api/assistant?is_public=true&teamspace_id=${teamspaceId}`
          : "/api/assistant?is_public=true",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch assistants");
      let assistants: Assistant[] = await response.json();
      if (!hasImageCompatibleModel) {
        assistants = assistants.filter(
          (assistant) =>
            !assistant.tools.some(
              (tool) => tool.in_code_tool_id === "ImageGenerationTool"
            )
        );
      }
      if (!hasAnyConnectors) {
        assistants = assistants.filter(
          (assistant) => assistant.num_chunks === 0
        );
      }
      setAssistants(assistants);

      await fetchAssistants();
    } catch (error) {
      console.error("Error refreshing assistants:", error);
    }
  };

  const {
    visibleAssistants,
    hiddenAssistants,
    finalAssistants,
    ownedButHiddenAssistants,
  } = useMemo(() => {
    const { visibleAssistants, hiddenAssistants } = classifyAssistants(
      user,
      assistants
    );

    const finalAssistants = user
      ? orderAssistantsForUser(visibleAssistants, user)
      : visibleAssistants;

    const ownedButHiddenAssistants = getUserCreatedAssistants(
      user,
      hiddenAssistants
    );

    return {
      visibleAssistants,
      hiddenAssistants,
      finalAssistants,
      ownedButHiddenAssistants,
    };
  }, [user, assistants]);

  return (
    <AssistantsContext.Provider
      value={{
        assistants,
        visibleAssistants,
        hiddenAssistants,
        finalAssistants,
        ownedButHiddenAssistants,
        refreshAssistants,
      }}
    >
      {children}
    </AssistantsContext.Provider>
  );
};

export const useAssistants = (): AssistantsContextProps => {
  const context = useContext(AssistantsContext);
  if (!context) {
    throw new Error("useAssistants must be used within an AssistantsProvider");
  }
  return context;
};
