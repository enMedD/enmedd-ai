import { Assistant } from "@/app/admin/assistants/interfaces";
import { Credential } from "./connectors/credentials";
import { Connector } from "./connectors/connectors";
import { ConnectorCredentialPairStatus } from "@/app/admin/connector/[ccPairId]/types";
import { ChatSession } from "@/app/chat/interfaces";

export interface UserPreferences {
  chosen_assistants: number[] | null;
  visible_assistants: number[];
  hidden_assistants: number[];
  default_model: string | null;
}

export enum UserStatus {
  live = "live",
  invited = "invited",
  deactivated = "deactivated",
}

export enum UserRole {
  BASIC = "basic",
  ADMIN = "admin",
  CURATOR = "curator",
  GLOBAL_CURATOR = "global_curator",
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.BASIC]: "Basic",
  [UserRole.ADMIN]: "Admin",
  [UserRole.GLOBAL_CURATOR]: "Global Curator",
  [UserRole.CURATOR]: "Curator",
};

export interface User {
  id: string;
  email: string;
  is_active: string;
  is_superuser: string;
  is_verified: string;
  role: UserRole;
  workspace?: Workspace;
  full_name?: string;
  company_name?: string;
  company_email?: string;
  company_billing?: string;
  billing_email_address?: string;
  vat?: string;
  preferences: UserPreferences;
  status: UserStatus;
  current_token_created_at?: Date;
  current_token_expiry_length?: number;
  oidc_expiry?: Date;
  groups?: MinimalTeamspaceSnapshot[];
  profile?: string;
}

export interface MinimalUserSnapshot {
  id: string;
  email: string;
}

export interface MinimalUserwithNameSnapshot {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export type ValidInputTypes = "load_state" | "poll" | "event";
export type ValidStatuses =
  | "success"
  | "completed_with_errors"
  | "failed"
  | "in_progress"
  | "not_started";
export type TaskStatus = "PENDING" | "STARTED" | "SUCCESS" | "FAILURE";
export type Feedback = "like" | "dislike";
export type AccessType = "public" | "private" | "sync";
export type SessionType = "Chat" | "Search";

export interface DocumentBoostStatus {
  document_id: string;
  semantic_id: string;
  link: string;
  boost: number;
  hidden: boolean;
}

export interface FailedConnectorIndexingStatus {
  cc_pair_id: number;
  name: string | null;
  error_msg: string | null;
  is_deletable: boolean;
  connector_id: number;
  credential_id: number;
}

export interface IndexAttemptSnapshot {
  id: number;
  status: ValidStatuses | null;
  new_docs_indexed: number;
  docs_removed_from_index: number;
  total_docs_indexed: number;
  error_msg: string | null;
  error_count: number;
  full_exception_trace: string | null;
  time_started: string | null;
  time_updated: string;
}

export interface ConnectorIndexingStatus<
  ConnectorConfigType,
  ConnectorCredentialType,
> {
  cc_pair_id: number;
  name: string | null;
  cc_pair_status: ConnectorCredentialPairStatus;
  connector: Connector<ConnectorConfigType>;
  credential: Credential<ConnectorCredentialType>;
  access_type: AccessType;
  owner: string;
  groups: number[];
  last_finished_status: ValidStatuses | null;
  last_status: ValidStatuses | null;
  last_success: string | null;
  docs_indexed: number;
  error_msg: string;
  latest_index_attempt: IndexAttemptSnapshot | null;
  deletion_attempt: DeletionAttemptSnapshot | null;
  is_deletable: boolean;
}

export interface CCPairBasicInfo {
  docs_indexed: number;
  has_successful_run: boolean;
  source: ValidSources;
}

export type ConnectorSummary = {
  count: number;
  active: number;
  public: number;
  totalDocsIndexed: number;
  errors: number; // New field for error count
};

export type GroupedConnectorSummaries = Record<ValidSources, ConnectorSummary>;

// DELETION

export interface DeletionAttemptSnapshot {
  connector_id: number;
  credential_id: number;
  status: TaskStatus;
}

// DOCUMENT SETS
export interface CCPairDescriptor<ConnectorType, CredentialType> {
  id: number;
  name: string | null;
  connector: Connector<ConnectorType>;
  credential: Credential<CredentialType>;
}

export interface DocumentSet {
  id: number;
  name: string;
  description: string;
  cc_pair_descriptors: CCPairDescriptor<any, any>[];
  is_up_to_date: boolean;
  is_public: boolean;
  users: string[];
  groups: { id: number; name: string; workspace: Workspace[] }[];
}

export interface Tag {
  tag_key: string;
  tag_value: string;
  source: ValidSources;
}

export interface Workspace {
  id: number;
  workspace_name: string;
  custom_logo: string;
  custom_header_logo: string;
}
// STANDARD ANSWERS
export interface StandardAnswerCategory {
  id: number;
  name: string;
}

export interface StandardAnswer {
  id: number;
  keyword: string;
  answer: string;
  match_regex: boolean;
  match_any_keywords: boolean;
  categories: StandardAnswerCategory[];
}

export interface MinimalWorkspaceSnapshot {
  id: number;
  workspace_name: string;
}

/* EE Only Types */
export interface Teamspace {
  id: number;
  name: string;
  description: string;
  creator: MinimalUserwithNameSnapshot;
  users: User[];
  curator_ids: string[];
  cc_pairs: CCPairDescriptor<any, any>[];
  document_sets: DocumentSet[];
  assistants: Assistant[];
  is_up_to_date: boolean;
  is_up_for_deletion: boolean;
  logo?: string;
}

export interface MinimalTeamspaceSnapshot {
  id: number;
  name: string;
  logo?: string;
  users: User[];
}

const validSources = [
  "web",
  "github",
  "gitlab",
  "google_drive",
  "gmail",
  "bookstack",
  "confluence",
  "jira",
  "productboard",
  "slab",
  "notion",
  "guru",
  "gong",
  "zulip",
  "linear",
  "hubspot",
  "document360",
  "requesttracker",
  "file",
  "google_sites",
  "loopio",
  "dropbox",
  "salesforce",
  "sharepoint",
  "teams",
  "zendesk",
  "discourse",
  "axero",
  "clickup",
  "wikipedia",
  "mediawiki",
  "asana",
  "s3",
  "r2",
  "google_cloud_storage",
  "xenforo",
  "oci_storage",
  "not_applicable",
  "ingestion_api",
  "google_sheets",
] as const;

export type ValidSources = (typeof validSources)[number];
// The valid sources that are actually valid to select in the UI
export type ConfigurableSources = Exclude<
  ValidSources,
  "not_applicable" | "ingestion_api" | "google_sheets"
>;

// The sources that have auto-sync support on the backend
export const validAutoSyncSources = ["confluence", "google_drive"] as const;
export type ValidAutoSyncSources = (typeof validAutoSyncSources)[number];
