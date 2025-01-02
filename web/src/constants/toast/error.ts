import { FullLLMProvider } from "@/app/admin/configuration/llm/interfaces";

// Unknown Error
export const GLOBAL_ERROR_MESSAGES = {
  UNKNOWN: {
    title: "Unknown Error",
    description: "An unexpected issue occurred. Please try again later.",
  },
  UNEXPECTED: {
    title: "Something went wrong",
    description: (errorMsg: string) =>
      `An unexpected issue occurred - ${errorMsg}`,
  },
};

// Update
export const OPERATION_ERROR_MESSAGES = {
  ACTION: {
    title: (action: string) => `${action} Failed`,
    description: (type: string, action: string, errorMsg: any) =>
      `Unable to ${action} ${type} - ${errorMsg}`,
  },
};

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
  SUBMIT: {
    title: "Connector Submission Failed",
    description: (errorMsg: string) =>
      `An unknown error occurred while submitting connector: ${errorMsg}`,
  },
  LINKED: {
    title: "Failed to Link Credential",
    description: (errorMsg: string) =>
      `An unknown error occurred while linking the credential: ${errorMsg}`,
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
  CREDENTIAL_DELETION: {
    title: "Deletion Failed",
    description: (errorMsg: string) =>
      `An error occurred on deleting credentail: ${errorMsg}`,
  },
  GOOGLE_SITE: {
    title: "Google Site Submitted Failed",
    description: "An error occurred on goolgle site submission",
  },
  FILE_UPLOAD: {
    title: "File Upload Failed",
    description: "An error occurred on file upload",
  },
  INVALID_FILE: {
    title: "Invalid File",
    description: (errorMsg: any) => `Invalid file provided: ${errorMsg}`,
  },
  APP_CREDENTIAL: {
    title: "Upload Failed",
    description: (errorMsg: string) =>
      `Failed to upload app credentials - ${errorMsg}`,
  },
  DELETE_SERVICE_ACCOUNT_KEY: {
    title: "Deleting Failed",
    description: (errorMsg: string) =>
      `Failed to delete service account key - ${errorMsg}`,
  },
  ACCESS_REVOKE: {
    title: "Access Revocation Error",
    description:
      "Cannot revoke access to Google Drive while any connector is still setup. Please delete all connectors, then try again.",
  },
  CREATE_SERVICE_ACCOUNT_KEY: {
    title: "Creating Failed",
    description: (errorMsg: string) =>
      `Failed to create service account credential - ${errorMsg}`,
  },
  AUTHENTICATION: {
    title: "Authentication Error",
    description: (errorMsg: string) => `Failed to authenticate - ${errorMsg}`,
  },
  SWAP: {
    title: "Swap Failed",
    description:
      "There was an issue swapping the credential. Please try again.",
  },
  UPDATE: {
    title: "Update Failed",
    description: `Issue updating credential`,
  },
  SCHEDULED_REMOVE: {
    title: "Deletion Scheduling Failed",
    description: (errorMsg: string) =>
      `There was an issue scheduling the deletion of the connector. Error: ${errorMsg}`,
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
  CANCEL_MODEL_UPDATE: {
    title: "Cancellation Failed",
    description: (response: string) =>
      `Failed to cancel embedding model update - ${response}`,
  },
  TEST_PROVIDER: {
    title: "Configuration Test Failed",
    description: (response: string) =>
      `Unable to validate the provider settings. Details: - ${response}`,
  },
  UPDATE_PROVIDER: {
    title: "Configuration Updated",
    description: "The embedding provider has been successfully updated.",
  },
  DELETE_ERROR: {
    title: "Deletion Error",
    description: "Model cannot be deleted",
  },
  DELETE_FAILED: {
    title: "Deletion Failed",
    description:
      "Failed to delete model. Ensure you are not attempting to delete a currently active model.",
  },
  UPDATE_SEARCH_SETTING: {
    title: "Update Failed",
    description: "Failed to update search settings",
  },
  CHANGE_PROVIDER: {
    title: "Change Failed",
    description: (errorMsg: string) =>
      `Could not change the embedding model - ${errorMsg}`,
  },
};

// Score Editor
export const SCORE_EDITOR_ERROR_MESSAGES = {
  UPDATE: {
    title: "Update Failed",
    description: (response: string) => `Failed to update - ${response}`,
  },
  INVALID_INPUT: {
    title: "Invalid Input",
    description: "Please enter a valid number for the score.",
  },
};

// Document Explorer
export const DOCUMENT_EXPLORER_ERROR_MESSAGES = {
  UPDATE: {
    title: "Document Update Failed",
    description: (response: Promise<any>) =>
      `Unable to update document status - ${response}`,
  },
};

// Document Feedback
export const DOCUMENT_FEEDBACK_ERROR_MESSAGES = {
  UPDATE: {
    title: "Document Update Failed",
    description: (response: Promise<any>) =>
      `Unable to update hidden status - ${response}`,
  },
};

// Document Set
export const DOCUMENT_SET_ERROR_MESSAGES = {
  UPDATE_CREATE: {
    title: "Action Failed",
    description: (isUpdate: boolean, errorMsg: string) =>
      isUpdate
        ? `Failed to update document set: ${errorMsg}`
        : `Failed to create document set: ${errorMsg}`,
  },
  DELETION: {
    title: "Deletion Failed",
    description: (errorMsg: string) =>
      `Failed to schedule document set for deletion - ${errorMsg}`,
  },
};

// Prompt
export const PROMPT_ERROR_MESSAGES = {
  DELETE: {
    title: "Delete Failed",
    description: (errorMsg: string) => `Failed to delete prompt - ${errorMsg}`,
  },
  UPDATE_CREATE: {
    title: (isUpdate?: boolean) =>
      `Input Prompt ${isUpdate ? "Update" : "Creation"} Failed`,
    description: (errorMsg: any, isUpdate?: boolean) =>
      `Failed on ${isUpdate ? "updating" : "creating"} prompt - ${errorMsg}`,
  },
  CREATE_FAILED: {
    title: "Prompt Creation Failed",
    description: "Failed to create the prompt.",
  },
};

// Settings
export const SETTINGS_ERROR_MESSAGES = {
  UPDATE: {
    title: "Settings Update Failed",
    description:
      "We encountered an issue while updating your settings. Please try again later.",
  },
  DEFAULT_PAGE: {
    title: "Invalid Default Page Setting",
    description: (type: string) =>
      `The default page cannot be set to '${type}' as the ${type} page is currently disabled. Please enable it or choose another page.`,
  },
  DISABLED: {
    title: "Action Not Allowed",
    description:
      "You cannot disable both the Chat and Search pages at the same time. At least one page needs to be enabled for the system to function properly.",
  },
};

// Settings Logo
export const SETTINGS_LOGO_ERROR_MESSAGES = {
  INVALID_TYPE: {
    title: "Invalid file type",
    description: "Please upload a valid image file.",
  },
};

// Image Upload
export const IMAGE_UPLOAD_ERROR_MESSAGES = {
  UPLOAD_FAILED: {
    title: "Upload Failed",
    description:
      "Only one file can be uploaded at a time. Please try again with a single file.",
  },
};

// Tool
export const TOOL_ERROR_MESSAGES = {
  FORMAT: {
    title: "Invalid JSON format",
    description: "Please check the JSON syntax and try again.",
  },
};

// Users
export const USERS_ERROR_MESSAGES = {
  REMOVE_INVITED: {
    title: "Failed to Remove User",
    description:
      "We encountered an issue while attempting to remove the invited user. Please try again or contact support if the problem persists",
  },
  NO_USER: {
    title: "No Users Selected",
    description: "Please select at least one user to invite.",
  },
};

// 2FA
export const TWOFACTOR_ERROR_MESSAGES = {
  AUTHENTICATION: {
    title: "Failed to authenticate. Invalid OTP code",
    description: `The code entered by the user does not match the code generated by the system or has expired`,
  },
  RESEND_OTP: {
    title: "Failed to Resend OTP Code",
    description: (errorMsg: string) =>
      `We encountered an issue while trying to resend the OTP code. Please try again or contact support if the problem persists - ${errorMsg}`,
  },
};

// Set New Password
export const PASSWORD_ERROR_MESSAGES = {
  REQUIREMENTS: {
    title: "Password doesn't meet requirements",
    description: (passwordWarning: string) =>
      passwordWarning || "Ensure your password meets all the criteria.",
  },
  NOT_MATCH: {
    title: "Your new password and confirm password do not match",
    description: `New password and confirm password must match. Please try again.`,
  },
  INCORRECT_CURRENT_PASSWORD: {
    title: "Incorrect current password",
    description: "Please check your current password and try again.",
  },
};

// New Verification Email
export const NEW_VERIFICATION_EMAIL_ERROR_MESSAGES = {
  SENT: {
    title: "Email Verification Failed",
    description: (errorDetail: string) =>
      `Unable to send verification email: ${errorDetail}. Please try again later.`,
  },
};

// Chat Page
export const CHAT_PAGE_ERROR_MESSAGES = {
  CHAT_BLOCKED: {
    title: "Action Blocked",
    description:
      "Please wait for the current response to complete before continuing.",
  },
  RESEND: {
    title: "Message Resend Failed",
    description:
      "Failed to re-send message - please refresh the page and try again.",
  },
  FEEDBACK: {
    title: "Submission Failed",
    description: (errorMsg: string) =>
      `We're sorry, but we couldn't submit your feedback: ${errorMsg}`,
  },
  UNSUPPORTED_INPUT: {
    title: "Unsupported Input",
    description:
      "The current Assistant does not support image input. Please choose an assistant that has Vision capabilities.",
  },
  UPLOAD_FILE_FOR_CHAT: {
    title: "Upload Failed",
    description: (errorMsg: string) => `Unable to upload files: ${errorMsg}`,
  },
  EDIT_FIRST_QUERY: {
    title: "Edit Error",
    description:
      "Cannot edit query of the first message - please refresh the page and try again.",
  },
  EDIT_PENDING_QUERY: {
    title: "Pending Message",
    description:
      "Cannot edit query of a pending message - please wait a few seconds and try again.",
  },
  FORCE_SEARCH: {
    title: "Force Search Error",
    description:
      "Failed to force search - please refresh the page and try again.",
  },
};

// Folder
export const FOLDER_ERROR_MESSAGES = {
  UPDATE_FOLDER_NAME: {
    title: "Folder Name Update Failed",
    description: "Unable to save the folder name. Please try again.",
  },
  FOLDER_DELETE: {
    title: "Folder Deletion Failed",
    description: "Unable to delete the folder. Please try again.",
  },
  DROP_FOLDER: {
    title: "Failed to Add Chat Session",
    description: (folderName: string) =>
      `An error occurred while adding the chat session to the folder "${folderName}". Please try again later.`,
  },
  CREATION: {
    title: "Folder Creation Failed",
    description: (errorMsg: string) =>
      `Unable to create the folder: ${errorMsg}. Please try again.`,
  },
  REMOVE: {
    title: "Removal Failed",
    description: "Unable to remove the chat from the folder. Please try again.",
  },
};

// Default Chat Model
export const DEFAULT_CHAT_MODEL_ERROR_MESSAGES = {
  UPDATE_FOLDER_NAME: {
    title: "Folder Name Update Failed",
    description: "Unable to save the folder name. Please try again.",
  },
  FOLDER_DELETE: {
    title: "Folder Deletion Failed",
    description: "Unable to delete the folder. Please try again.",
  },
  DROP_FOLDER: {
    title: "Failed to Add Chat Session",
    description: (folderName: string) =>
      `An error occurred while adding the chat session to the folder "${folderName}". Please try again later.`,
  },
  UPDATE: {
    title: "Update Failed",
    description:
      "There was an issue updating the default model. Please try again.",
  },
};

// Chat Session
export const CHAT_SESSION_ERROR_MESSAGES = {
  RENAME: {
    title: "Failed to rename chat session",
    description: "There was an issue renaming the chat session.",
  },
  DELETE: {
    title: "Failed to delete chat session",
    description: "There was an issue deleting the chat session.",
  },
};

// Share Chat Session
export const SHARE_CHAT_SESSION_ERROR_MESSAGES = {
  DELETE_LINK: {
    title: "Failed to delete share link",
    description: "There was an issue deleting the share link.",
  },
  GENERATE_LINK: {
    title: "Failed to generate share link",
    description: "There was an issue generating the share link.",
  },
  UNEXPECTED: {
    title: "Unexpected Error",
    description:
      "An unexpected error occurred while generating the share link.",
  },
};

// API Key
export const API_KEY_ERROR_MESSAGES = {
  UPDATE_CREATE: {
    title: (isUpdate?: boolean) =>
      isUpdate ? "Error Updating API Key" : "Error Creating API Key",
    description: (isUpdate?: boolean, errorMsg?: string) =>
      `Failed to ${isUpdate ? "update" : "create"} API key: ${errorMsg}`,
  },
  DELETE: {
    title: "Deletion Failed",
    description: (errorMsg: string) => `Failed to delete API Key: ${errorMsg}`,
  },
  REGENERATE: {
    title: "Regeneration Failed",
    description: (errorMsg: string) =>
      `Failed to regenerate API Key: ${errorMsg}`,
  },
};

// Custom Analytics
export const CUSTOM_ANALYTICS_ERROR_MESSAGES = {
  UPDATE: {
    title: "Update Failed",
    description: (errorMsg: string) =>
      `Unable to update the custom analytics script: "${errorMsg}". Please try again.`,
  },
};

// Teamspace
export const TEAMSPACE_ERROR_MESSAGES = {
  DELETE: {
    title: "Teamspace Deletion Error",
    description: (errorMsg: string) =>
      `Failed to delete the teamspace: ${errorMsg}. Please try again.`,
  },
  DESCRIPTION: {
    title: "Teamspace Description Update Failed",
    description:
      "An error occurred while updating the description. Please try again.",
  },
  NAME: {
    title: "Teamspace Name Update Failed",
    description:
      "An error occurred while updating the teamspace name. Please try again.",
  },
  LEAVE: {
    title: "Unable to Leave Teamspace",
    description: (errorMsg: string) =>
      `We couldn't process your request. Error: ${errorMsg}`,
  },
};

// Teamspace Creation
export const TEAMSPACE_CREATION_ERROR_MESSAGES = {
  TITLE: "Teamspace Creation Failed",
  NO_USER: {
    description: "Please select at least one user with a role",
  },
  NO_ADMIN: {
    description: "Please include at least one admin in the users list",
  },
  UPDATE_CREATE: {
    description: (isUpdate?: boolean, errorMsg?: string) =>
      isUpdate
        ? `Could not update the teamspace: ${errorMsg}`
        : `Could not create the teamspace: ${errorMsg}`,
  },
};

// Teamspace Assistant
export const TEAMSPACE_ASSISTANT_ERROR_MESSAGES = {
  NO_ASSISTANT: {
    title: "Update Failed",
    description: "You need to select at least one assistant.",
  },
};

// Teamspace Member
export const TEAMSPACE_MEMBER_ERROR_MESSAGES = {
  CHANGE_ROLE: {
    title: "Error Updating User Role",
    description: (userEmail: string) =>
      `An error occurred while updating the role for ${userEmail}. Please try again.`,
  },
  NO_ADMIN: {
    title: "Action Forbidden",
    description:
      "At least one admin must remain in the teamspace. You cannot remove the last admin.",
  },
  REMOVE: {
    title: "Failed to Remove User(s)",
    description: (selectedUsers: string[], errorMsg: string) =>
      `An error occurred while removing ${
        selectedUsers.length > 1 ? "users" : "the user"
      }: ${errorMsg}`,
  },
  ADD: {
    title: "Failed to Add User(s)",
    description: (selectedUsers: string[]) =>
      selectedUsers.length > 1
        ? `An error occurred while adding users. Please try again.`
        : `An error occurred while adding the user. Please try again.`,
  },
};

// Logout
export const LOGOUT_ERROR_MESSAGES = {
  FAILED: {
    title: "Logout Failed",
    description: "There was an issue logging out. Please try again.",
  },
};
