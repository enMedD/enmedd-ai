import { FullLLMProvider } from "@/app/admin/configuration/llm/interfaces";

// Login
export const LOGIN_ERROR_MESSAGES = {
  LOGIN_FAILED: {
    title: "Login Failed",
    description: "An unexpected error occurred",
  },
  LOGIN_USER_NOT_VERIFIED: {
    title: "Login Failed",
    description: "User not yet verified",
  },
  LOGIN_BAD_CREDENTIALS: {
    title: "Login Failed",
    description: "Invalid email or password",
  },
};

// Sign Up
export const SIGNUP_ERROR_MESSAGES = {
  SIGNUP_FAILED: {
    title: "Sign-Up Failed",
    description: (errorMsg: string | null) => `Failed to sign up - ${errorMsg}`,
  },
  PASSWORD_REQUIREMENTS: {
    title: "Password Requirements Not Met",
    description:
      "Password must be at least 8 characters, include an uppercase letter, and a number or special character.",
  },
  INVALID_INVITE_TOKEN: {
    title: "Invalid Invite Token",
    description: "The invite token provided is invalid.",
  },
  OTP_GENERATION_FAILED: {
    title: "OTP Generation Failed",
    description: "An unexpected error occurred while generating OTP.",
  },
};

// Recaptcha
export const RECAPTCHA_MISSING = {
  title: "ReCAPTCHA Missing",
  description: "Please complete the ReCAPTCHA to proceed.",
};

// Assistant
export const ASSISTANT_ERROR_MESSAGES = {
  SUBMISSION_BLOCKED: {
    title: "Submission Blocked",
    description: "Please resolve the errors in the form before submitting.",
  },
  MODEL_SELECTION_REQUIRED: {
    title: "Model Selection Required",
    description:
      "Please select a model when choosing a non-default LLM provider.",
  },
  ASSISTANT_NAME_TAKEN: {
    title: "Assistant Name Taken",
    description: (assistantName: string) =>
      `"${assistantName}" is already taken. Please choose a different name.`,
  },
  ASSISTANT_CREATION_FAILED: {
    title: "Assistant Creation Failed",
    description: (error: string | null) =>
      `Failed to create Assistant - ${error}`,
  },
  ASSISTANT_ADD_FAILED: {
    title: "Failed to Add Assistant",
    description: (assistantName: string) =>
      `"${assistantName}" could not be added to your list.`,
  },
  ASSISTANT_ORDER_FAILED: {
    title: "Failed to Update Assistant Order",
    description: (errorMsg: string) =>
      `There was an issue updating the assistant order. Details: ${errorMsg}`,
  },
  ASSISTANT_DELETE_FAILURE: {
    title: (teamspaceId?: string | string[]) =>
      `Failed to ${teamspaceId ? "Remove" : "Delete"} Assistant`,
    description: (errorMsg: string, teamspaceId?: string | string[]) =>
      `There was an issue ${
        teamspaceId ? "removing" : "deleting"
      } the assistant. Details: ${errorMsg}`,
  },
  ASSISTANT_UPDATE_VISIBILITY_FAILED: {
    title: "Failed to Update Assistant Visibility",
    description: (assistantName: string, errorMsg: string) =>
      `Unable to update visibility for "${assistantName}". Details: ${errorMsg}`,
  },
};

// Data Source
export const DATA_SOURCE_ERROR_MESSAGES = {
  UPDATE_STATUS: {
    title: "Update Failed",
    description: "Failed to update connector status",
  },
  NAME_UPDATE: {
    title: "Update Failed",
    description: "Failed to update connector name",
  },
  CONNECTOR_RUN: {
    title: "Connector Run Failed",
    description: (errorMsg: string) =>
      `An error occurred while triggering the connector: ${errorMsg}`,
  },
};

// LLM
export const LLM_ERROR_MESSAGES = {
  PROVIDER: {
    title: "Default Provider Error",
    description: (errorMsg: string) =>
      `Failed to set provider as default: ${errorMsg}`,
  },
  SET_DEFAULT_PROVIDER: {
    title: "Failed to Set Default Provider",
    description: (providerName: string, errorMsg: string) =>
      `Unable to set "${providerName}" as the default provider: ${errorMsg}`,
  },
  REQUIRED_MODEL_NAME: {
    title: "Model Name Required",
    description: "At least one model name is required",
  },
  UPDATE_LLM: {
    title: (existingLlmProvider: FullLLMProvider | undefined) =>
      `${existingLlmProvider ? "Update" : "Enable"} Failed`,
    description: (
      existingLlmProvider: FullLLMProvider | undefined,
      errorMsg: string
    ) =>
      `Failed to ${existingLlmProvider ? "update" : "enable"} provider: ${errorMsg}`,
  },
};

// Mail
export const MAIL_ERROR_MESSAGES = {
  INCOMPLETE_EMAIL: {
    title: "Incomplete Email Information",
    description: "Make sure to add values for the email, subject, and body.",
  },
  MAIL_ERROR: {
    title: "Sample Mail Error",
    description: (status: number) =>
      `An error occured in sending sample mail (status-code=${status})`,
  },
  TEMPLATE_VALUE: {
    title: "Email Template Value Error",
    description: "Email subject and body must contain any value",
  },
  TEMPLATE_UPDATE: {
    title: "Email Template Update Failed",
    description: (status: number) =>
      `Error occured in updating email (status-code=${status})`,
  },
};

// Embeddings
export const EMBEDDING_ERROR_MESSAGES = {
  CANCELLATION: {
    title: "Cancellation Failed",
    description: (response: string) =>
      `Failed to cancel embedding model update - ${response}`,
  },
};
