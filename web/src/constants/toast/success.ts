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
  CREATE: {
    title: "Data Source Created",
    description:
      "Successfully added data source. Redirecting to Add Data Source page",
  },
  SUBMIT: {
    title: "Submitted Successfully",
    description: "Connector submitted successfully!",
  },
  UPDATE: {
    title: "Update Successful",
    description: "Credential updated successfully!",
  },
  LINKED: {
    title: "Successfully Linked",
    description: "Credential successfully linked to the connector.",
  },
  CONNECTOR_DELETION: {
    title: "Deletion Successful",
    description: "Connector deleted successfully",
  },
  CREDENTIAL_CREATE: {
    title: "Credential Created",
    description: (credentialName?: string) =>
      `Created new credential: ${credentialName}`,
  },
  CREDENTIAL_DELETION: {
    title: "Deletion Successful",
    description: "Credential deleted successfully!",
  },
  CREDENTIAL_SWAP: {
    title: "Swap Successful",
    description: "Swapped credential successfully!",
  },
  CREDENTIAL_OPERATION: {
    title: (isSuccess: boolean) =>
      `Operation ${isSuccess ? "Success" : "Error"}`,
    description: (message?: string) => message,
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
  GOOGLE_SITE: {
    title: "Google Site Submitted",
    description: "Your Google site has been successfully submitted!",
  },
  FILE_UPLOAD: {
    title: "Success Uploaded File",
    description: "Successfully uploaded files!",
  },
  APP_CREDENTIAL: {
    title: "Uploaded Successfully",
    description: "Successfully uploaded app credentials",
  },
  DELETE_SERVICE_ACCOUNT_KEY: {
    title: "Deleted Successfully",
    description: "Successfully deleted service account key",
  },
  ACCESS_REVOKE: {
    title: "Revoke Access Successful",
    description: "Successfully revoked access to Google Drive!",
  },
  CREATE_SERVICE_ACCOUNT_KEY: {
    title: "Success Creted",
    description: "Successfully created service account credential",
  },
  SCHEDULED_REMOVE: {
    title: "Deletion Scheduled",
    description: `The deletion of the connector has been successfully scheduled. You will be notified once it's complete.`,
  },
  DELETE: {
    title: "Connector Removed Successfully",
    description:
      "The connector has been successfully removed from the teamspace.",
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

// Embeddings
export const EMBEDDING_SUCCESS_MESSAGES = {
  DELETE_MODEL: {
    title: "Action Success",
    description: "Model deleted successfully",
  },
  UPDATE_SEARCH_SETTING: {
    title: "Update Success",
    description: "Updated search settings successfully",
  },
  CHANGE_PROVIDER: {
    title: "Provider Change Successful",
    description:
      "You have successfully changed the provider. Redirecting to the embedding page...",
  },
};

// Score Editor
export const SCORE_EDITOR_SUCCESS_MESSAGES = {
  UPDATE: {
    title: "Score Updated",
    description: "The score has been successfully updated.",
  },
};

// Document Explorer
export const DOCUMENT_EXPLORER_SUCCESS_MESSAGES = {
  UPDATE: {
    title: "Document Status Updated",
    description: (newHiddenStatus: boolean) =>
      `Document is now ${newHiddenStatus ? "Hidden" : "Visible"}.`,
  },
};

// Document Feedback
export const DOCUMENT_FEEDBACK_SUCCESS_MESSAGES = {
  UPDATE: {
    title: "Status Updated",
    description: "The visibility status has been successfully updated.",
  },
};

// Document Set
export const DOCUMENT_SET_SUCCESS_MESSAGES = {
  UPDATE_CREATE: {
    title: (isUpdate: boolean) =>
      isUpdate ? "Document Set Updated" : "New Document Set Created",
    description: (isUpdate: boolean) =>
      isUpdate
        ? "Your document set has been updated successfully."
        : "Your new document set has been created successfully.",
  },
  DELETION: {
    title: "Deletion Scheduled",
    description: (documentName: string) =>
      `Document set "${documentName}" scheduled for deletion.`,
  },
};

// PROMPT
export const PROMPT_SUCCESS_MESSAGES = {
  UPDATE_CREATE: {
    title: (isUpdate?: boolean) =>
      `Input Prompt ${isUpdate ? "Updated" : "Created"}`,
    description: (isUpdate?: boolean) =>
      `Input prompt was successfully ${isUpdate ? "updated" : "created"}.`,
  },
};

// Settings
export const SETTINGS_SUCCESS_MESSAGES = {
  UPDATE: {
    title: "Settings Updated",
    description: "Settings have been successfully updated!",
  },
};

// Logo
export const LOGO_SUCCESS_MESSAGES = {
  WORKSPACE_LOGO_DELETE: {
    title: "Workspace Logo Deleted",
    description: "The workspace logo has been successfully removed.",
  },
  WORKSPACE_HEADER_LOGO_DELETE: {
    title: "Header Logo Deleted",
    description: "The header logo has been successfully removed.",
  },
  TEAMSPACE_LOGO: {
    title: "Teamspace Logo Removed",
    description: "The teamspace logo has been successfully removed.",
  },
};

// SMTP Settings
export const SMTP_SETTINGS_SUCCESS_MESSAGES = {
  UPDATE: {
    title: "SMTP Settings Updated",
    description: "The SMTP settings have been successfully updated.",
  },
};

// Token Rate
export const TOKEN_RATE_SUCCESS_MESSAGES = {
  CREATE: {
    title: "Token Rate Limit Created",
    description: "The token rate limit has been successfully established.",
  },
  DELETE: {
    title: "Deletion Success",
    description: (groupName?: string) =>
      `Token rate "${groupName}" deletion success.`,
  },
};

// Tool
export const TOOL_SUCCESS_MESSAGES = {
  FORMAT: {
    title: "Definition formatted",
    description: "The definition has been successfully formatted.",
  },
  DELETE: {
    title: "Tool Deleted",
    description: "The tool has been successfully deleted.",
  },
};

// Users
export const USERS_SUCCESS_MESSAGES = {
  PROMOTION: {
    title: "User Promotion Successful",
    description: "The user has been successfully promoted to admin.",
  },
  DEMOTION: {
    title: "Demotion Successful",
    description: "The user has been successfully demoted to a basic user.",
  },
  REMOVE: {
    title: "User Removed",
    description: "The user has been successfully removed from the teamspace.",
  },
  INVITE: {
    title: "Invitation Sent Successfully",
    description:
      "The selected users have been successfully invited to join your platform.",
  },
  REMOVE_INVITED: {
    title: "User Removed Successfully",
    description: "The invited user has been removed from your list",
  },
  DEACTIVATE: {
    title: "User Status Updated",
    description: (deactivate: boolean) =>
      `User has been successfully ${deactivate ? "deactivated" : "activated"}.`,
  },
  TEAMSPACE_INVITE: {
    title: (selectedEmails: string[]) =>
      `Invited ${selectedEmails.length} ${selectedEmails.length === 1 ? "User" : "Users"}`,
    description: (selectedEmails: string[]) =>
      `${selectedEmails.length} ${selectedEmails.length === 1 ? "user" : "users"} invited successfully.`,
  },
};

// 2FA
export const TWOFACTOR_SUCCESS_MESSAGES = {
  AUTHENTICATION: {
    title: "Authenticated Successfully",
    description: "You have been logged in and redirected to chat.",
  },
  RESEND_OTP: {
    title: "OTP Code Resent Successfully",
    description:
      "A new OTP code has been sent to your registered email/phone. Please check your inbox or messages to retrieve it.",
  },
};

// Set New Password
export const PASSWORD_SUCCESS_MESSAGES = {
  CHANGE: {
    title: "Password Updated Successfully",
    description:
      "Your password has been changed. Please use it for future logins.",
  },
};

// New Verification Email
export const NEW_VERIFICATION_EMAIL_SUCCESS_MESSAGES = {
  SENT: {
    title: "Verification Email Sent",
    description:
      "We've sent a new verification email to your inbox. Please check your email.",
  },
};

// Chat Page
export const CHAT_PAGE_SUCCESS_MESSAGES = {
  FEEDBACK: {
    title: "Feedback Submitted",
    description: "Thank you for sharing your thoughts with us!",
  },
  FOLDER_DELETE: {
    title: "Folder Deleted",
    description: "The folder has been successfully deleted.",
  },
};

// Folder
export const FOLDER_SUCCESS_MESSAGES = {
  FOLDER_DELETE: {
    title: "Folder Deleted",
    description: "The folder has been successfully deleted.",
  },
  DROP_FOLDER: {
    title: "Chat Session Added",
    description: (folderName: string) =>
      `Chat session has been successfully added to the folder "${folderName}".`,
  },
  CREATION: {
    title: "Folder Created Successfully",
    description: (folderId: number) =>
      `Your folder with ID: ${folderId} has been created.`,
  },
  REMOVE: {
    title: "Chat Removed from Folder",
    description: "The chat has been successfully removed from the folder.",
  },
};

// Default Chat Model
export const DEFAULT_CHAT_MODEL_SUCCESS_MESSAGES = {
  UPDATE: {
    title: "Default Model Updated",
    description: "The default model has been successfully updated.",
  },
};

// Chat Session
export const CHAT_SESSION_SUCCESS_MESSAGES = {
  RENAME: {
    title: "Chat session renamed",
    description: "The chat session has been successfully renamed.",
  },
  DELETE: {
    title: "Chat session deleted",
    description: "The chat session has been successfully deleted.",
  },
};

// Share Chat Session
export const SHARE_CHAT_SESSION_SUCCESS_MESSAGES = {
  DELETE_LINK: {
    title: "Share link deleted",
    description: "The share link has been successfully deleted.",
  },
  GENERATE_LINK: {
    title: "Share link generated and copied",
    description:
      "The share link has been successfully copied to the clipboard.",
  },
};

// API Key
export const API_KEY_SUCCESS_MESSAGES = {
  UPDATE_CREATE: {
    title: (isUpdate?: boolean) =>
      isUpdate ? "API Key Updated" : "API Key Created",
    description: (isUpdate?: boolean) =>
      isUpdate
        ? "API key updated successfully!"
        : "API key created successfully!",
  },
  DELETE: {
    title: "Deletion Success",
    description: `API Key deleted successfully.`,
  },
};

// Custom Analytics
export const CUSTOM_ANALYTICS_SUCCESS_MESSAGES = {
  UPDATE: {
    title: "Update Successful",
    description: "Custom analytics script has been updated successfully",
  },
};

// Teamspace
export const TEAMSPACE_SUCCESS_MESSAGES = {
  DELETE: {
    title: "Teamspace Deleted!",
    description: (teamspaceName: string) =>
      `Successfully deleted the teamspace: "${teamspaceName}".`,
  },
  UPDATE: {
    title: "Update Successful",
    description: "Teamspace updated successfully.",
  },
  UPDATE_TYPE: {
    title: (type: string) => `${type} Updated`,
    description: (type: string) =>
      `${type} have been successfully updated in the teamspace.`,
  },
  DESCRIPTION: {
    title: "Teamspace Description Updated",
    description: (selectedTeamspaceName: string) =>
      `The description for "${selectedTeamspaceName}" has been updated successfully.`,
  },
  NAME: {
    title: "Teamspace Name Updated",
    description: (tempName: string) =>
      `The name for "${tempName}" has been updated successfully.`,
  },
  LEAVE: {
    title: "Successfully Left Teamspace",
    description:
      "You are no longer a part of this teamspace. Your access and permissions have been revoked.",
  },
};

// Teamspace Creation
export const TEAMSPACE_CREATION_SUCCESS_MESSAGES = {
  UPDATE_CREATE: {
    title: (isUpdate?: boolean) =>
      isUpdate ? "Teamspace Updated!" : "Teamspace Created!",
    description: (isUpdate?: boolean) =>
      isUpdate
        ? "Your teamspace has been updated successfully."
        : "Your new teamspace has been created successfully.",
  },
};

// Teamspace Member
export const TEAMSPACE_MEMBER_SUCCESS_MESSAGES = {
  CHANGE_ROLE: {
    title: "User Role Updated",
    description: (userEmail: string, newRole: string) =>
      `The role for ${userEmail} has been successfully updated to ${newRole}.`,
  },
  REMOVE: {
    title: "User(s) Removed Successfully",
    description: (selectedUsers: string[]) =>
      selectedUsers.length > 1
        ? `${selectedUsers.length} users have been successfully removed from the teamspace.`
        : `The user has been successfully removed from the teamspace.`,
  },
  ADD: {
    title: "Users Added Successfully",
    description: (selectedUsers: string[]) =>
      selectedUsers.length > 1
        ? `${selectedUsers.length} users have been successfully added to the teamspace.`
        : `The user has been successfully added to the teamspace.`,
  },
};

// Profile
export const PROFILE_SUCCESS_MESSAGES = {
  UPDATE: {
    title: "Profile Updated Successfully",
    description: "Your profile and settings have been updated.",
  },
  REMOVE_PHOTO: {
    title: "Profile photo removed",
    description: "Your profile photo has been successfully removed.",
  },
};
