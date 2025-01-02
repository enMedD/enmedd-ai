"use client";

import { Loading } from "@/components/Loading";
import { ErrorCallout } from "@/components/ErrorCallout";
import { Divider, Text } from "@tremor/react";
import { useState } from "react";
import AddPromptModal from "./modals/AddPromptModal";
import EditPromptModal from "./modals/EditPromptModal";
import { PromptLibraryTable } from "./promptLibrary";
import { CreateInputPromptRequest, InputPrompt } from "./interfaces";
import { Button } from "@/components/ui/button";
import { CustomModal } from "@/components/CustomModal";
import { BookstackIcon } from "@/components/icons/icons";
import { useToast } from "@/hooks/use-toast";
import { PROMPT_ERROR_MESSAGES } from "@/constants/error";
import { PROMPT_SUCCESS_MESSAGES } from "@/constants/success";

export const PromptSection = ({
  promptLibrary,
  isLoading,
  error,
  refreshPrompts,
  centering = false,
  isPublic,
}: {
  promptLibrary: InputPrompt[];
  isLoading: boolean;
  error: any;
  refreshPrompts: () => void;
  centering?: boolean;
  isPublic: boolean;
}) => {
  const { toast } = useToast();
  const [newPrompt, setNewPrompt] = useState(false);
  const [newPromptId, setNewPromptId] = useState<number | null>(null);

  const createInputPrompt = async (
    promptData: CreateInputPromptRequest
  ): Promise<InputPrompt> => {
    const response = await fetch("/api/input_prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...promptData, is_public: isPublic }),
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      toast({
        title: PROMPT_ERROR_MESSAGES.UPDATE_CREATE.title(),
        description: PROMPT_ERROR_MESSAGES.UPDATE_CREATE.description(errorMsg),
        variant: "destructive",
      });
      throw new Error(errorMsg);
    }

    refreshPrompts();
    toast({
      title: PROMPT_SUCCESS_MESSAGES.UPDATE_CREATE.title(),
      description: PROMPT_SUCCESS_MESSAGES.UPDATE_CREATE.description(),
      variant: "destructive",
    });
    return response.json();
  };

  const editInputPrompt = async (
    promptId: number,
    values: CreateInputPromptRequest
  ) => {
    try {
      const response = await fetch(`/api/input_prompt/${promptId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        toast({
          title: PROMPT_ERROR_MESSAGES.UPDATE_CREATE.title(true),
          description: PROMPT_ERROR_MESSAGES.UPDATE_CREATE.description(
            errorMsg,
            true
          ),
          variant: "destructive",
        });
        return;
      }

      setNewPromptId(null);
      refreshPrompts();

      toast({
        title: PROMPT_SUCCESS_MESSAGES.UPDATE_CREATE.title(true),
        description: PROMPT_SUCCESS_MESSAGES.UPDATE_CREATE.description(true),
        variant: "destructive",
      });
    } catch (err) {
      toast({
        title: PROMPT_ERROR_MESSAGES.UPDATE_CREATE.title(true),
        description: PROMPT_ERROR_MESSAGES.UPDATE_CREATE.description(err, true),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error || !promptLibrary) {
    return (
      <ErrorCallout
        errorTitle="Error loading standard answers"
        errorMsg={error?.info?.message || error?.message?.info?.detail}
      />
    );
  }

  const handleEdit = (promptId: number) => {
    setNewPromptId(promptId);
    console.log(promptId);
  };

  return (
    <div
      className={`w-full ${centering ? "flex-col flex justify-center" : ""} mb-8`}
    >
      {newPromptId && (
        <EditPromptModal
          promptId={newPromptId}
          editInputPrompt={editInputPrompt}
          onClose={() => setNewPromptId(null)}
        />
      )}
      <div className={centering ? "max-w-sm mx-auto" : ""}>
        <Text className="my-auto mb-2">
          Create prompts that can be accessed with the <i>`/`</i> shortcut in
          Arnold AI Chat.{" "}
          {isPublic
            ? "Prompts created here will be accessible to all users."
            : "Prompts created here will be available only to you."}
        </Text>
      </div>

      <div className="mb-2"></div>

      <CustomModal
        trigger={
          <Button
            onClick={() => setNewPrompt(true)}
            className={centering ? "mx-auto" : ""}
          >
            New Prompt
          </Button>
        }
        onClose={() => {
          setNewPrompt(false);
          localStorage.removeItem("promptFormData");
        }}
        open={newPrompt}
        title={
          <p className="flex items-center gap-2">
            <BookstackIcon size={20} />
            Add prompt
          </p>
        }
      >
        <AddPromptModal
          onSubmit={createInputPrompt}
          onClose={() => setNewPrompt(false)}
        />
      </CustomModal>

      <Divider />

      <div>
        <PromptLibraryTable
          isPublic={isPublic}
          promptLibrary={promptLibrary}
          refresh={refreshPrompts}
          handleEdit={handleEdit}
        />
      </div>
    </div>
  );
};
