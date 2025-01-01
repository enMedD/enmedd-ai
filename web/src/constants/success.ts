import { FullLLMProvider } from "@/app/admin/configuration/llm/interfaces";

// Assistant
export const ASSISTANT_SUCCESS_MESSAGES = {
  ASSISTANT_UPDATED: {
    title: "Assistant Updated",
    description: (assistantName: string) =>
      `"${assistantName}" has been successfully updated.`,
  },
  ASSISTANT_ADDED: {
    title: "Assistant Added",
    description: (assistantName: string) =>
      `"${assistantName}" has been added to your list.`,
  },
  ASSISTANT_ACTION: {
    title: (teamspaceId?: string | string[]) =>
      `Assistant ${teamspaceId ? "Removed" : "Deleted"}`,
    description: (teamspaceId?: string | string[]) =>
      `The assistant has been successfully ${teamspaceId ? "removed" : "deleted"}.`,
  },
  ASSISTANT_VISIBILITY_UPDATED: {
    title: "Assistant Visibility Updated",
    description: (assistantName: string) =>
      `The visibility of "${assistantName}" has been successfully updated.`,
  },
  ASSISTANT_DELETED: {
    title: "Assistant Deleted",
    description: (assistantName: string) =>
      `"${assistantName}" has been successfully deleted.`,
  },
};

// Data Source
export const DATA_SOURCE_SUCCESS_MESSAGES = {
  DELETION: {
    title: "Deletion Successful",
    description: "Connector deleted successfully",
  },
  NAME_UPDATE: {
    title: "Update Successful",
    description: "Connector name updated successfully",
  },
  UPDATE_STATUS: {
    title: "Status Updated",
    description: (active: boolean) =>
      active ? "Enabled connector!" : "Paused connector!",
  },
  CONNECTOR_RUN: {
    title: "Connector Run Successful",
    description: "The connector has been triggered successfully.",
  },
};

// LLM
export const LLM_SUCCESS_MESSAGES = {
  SET_DEFAULT_PROVIDER: {
    title: "Default Provider Set",
    description: (providerName: string) =>
      `"${providerName}" is now the default provider!`,
  },
  UPDATE_PROVIDER: {
    title: (existingLlmProvider: FullLLMProvider | undefined) =>
      `Successfully ${existingLlmProvider ? "Updated" : "Enabled"}`,
    description: (existingLlmProvider: FullLLMProvider | undefined) =>
      `Provider ${existingLlmProvider ? "updated" : "enabled"} successfully!`,
  },
};

// Mail
export const MAIL_SUCCESS_MESSAGES = {
  SENT_SUCCESS: {
    title: "Sample Mail",
    description: "Sample mail successfully sent!",
  },
  INCOMPLETE_EMAIL: {
    title: "Sample Mail",
    description: "Sample mail successfully sent!",
  },
  TEMPLATE_UPDATE: {
    title: "Email Template Update Successfully",
    description: "Successfully updated email template!",
  },
};
