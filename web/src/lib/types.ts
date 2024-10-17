import { Assistant } from "@/app/admin/assistants/interfaces";
import { ChatSession } from "@/app/chat/interfaces";

export interface UserPreferences {
  chosen_assistants: number[] | null;
}

export enum UserStatus {
  live = "live",
  invited = "invited",
  deactivated = "deactivated",
}

export interface User {
  id: string;
  email: string;
  is_active: string;
  is_superuser: string;
  is_verified: string;
  role: "basic" | "admin";
  workspace?: Workspace;
  full_name?: string;
  company_name?: string;
  company_email?: string;
  company_billing?: string;
  billing_email_address?: string;
  vat?: string;
  preferences: UserPreferences;
  status: UserStatus;
  groups?: MinimalTeamspaceSnapshot[];
}

export interface MinimalUserSnapshot {
  id: string;
  email: string;
}

export type ValidSources =
  | "web"
  | "github"
  | "gitlab"
  | "google_drive"
  | "gmail"
  | "confluence"
  | "jira"
  | "productboard"
  | "notion"
  | "hubspot"
  | "google_sites"
  | "google_sheets"
  | "dropbox"
  | "salesforce"
  | "sharepoint"
  | "teams"
  | "zendesk"
  | "file"
  | "s3"
  | "r2"
  | "google_cloud_storage"
  | "oci_storage";

export type ValidInputTypes = "load_state" | "poll" | "event";
export type ValidStatuses =
  | "success"
  | "failed"
  | "in_progress"
  | "not_started";
export type TaskStatus = "PENDING" | "STARTED" | "SUCCESS" | "FAILURE";
export type Feedback = "like" | "dislike";

export interface DocumentBoostStatus {
  document_id: string;
  semantic_id: string;
  link: string;
  boost: number;
  hidden: boolean;
}

// CONNECTORS
export interface ConnectorBase<T> {
  name: string;
  input_type: ValidInputTypes;
  source: ValidSources;
  connector_specific_config: T;
  refresh_freq: number | null;
  prune_freq: number | null;
  disabled: boolean;
}

export interface Connector<T> extends ConnectorBase<T> {
  id: number;
  credential_ids: number[];
  time_created: string;
  time_updated: string;
}

export interface WebConfig {
  base_url: string;
  web_connector_type?: "recursive" | "single" | "sitemap";
}

export interface GithubConfig {
  repo_owner: string;
  repo_name: string;
  include_prs: boolean;
  include_issues: boolean;
}

export interface GitlabConfig {
  project_owner: string;
  project_name: string;
  include_mrs: boolean;
  include_issues: boolean;
}

export interface GoogleDriveConfig {
  folder_paths?: string[];
  include_shared?: boolean;
  follow_shortcuts?: boolean;
  only_org_public?: boolean;
}

export interface GmailConfig {}

export interface BookstackConfig {}

export interface ConfluenceConfig {
  wiki_page_url: string;
}

export interface JiraConfig {
  jira_project_url: string;
  comment_email_blacklist?: string[];
}

export interface SalesforceConfig {
  requested_objects?: string[];
}

export interface SharepointConfig {
  sites?: string[];
}

export interface AxeroConfig {
  spaces?: string[];
}

export interface TeamsConfig {
  teams?: string[];
}

export interface DiscourseConfig {
  base_url: string;
  categories?: string[];
}

export interface TeamsConfig {
  teams?: string[];
}

export interface ProductboardConfig {}

export interface GuruConfig {}

export interface FileConfig {
  file_locations: string[];
}

export interface NotionConfig {
  root_page_id?: string;
}

export interface HubSpotConfig {}

export interface ClickupConfig {
  connector_type: "list" | "folder" | "space" | "workspace";
  connector_ids?: string[];
  retrieve_task_comments: boolean;
}

export interface GoogleSitesConfig {
  zip_path: string;
  base_url: string;
}

export interface ZendeskConfig {}

export interface DropboxConfig {}

export interface S3Config {
  bucket_type: "s3";
  bucket_name: string;
  prefix: string;
}

export interface R2Config {
  bucket_type: "r2";
  bucket_name: string;
  prefix: string;
}

export interface GCSConfig {
  bucket_type: "google_cloud_storage";
  bucket_name: string;
  prefix: string;
}

export interface OCIConfig {
  bucket_type: "oci_storage";
  bucket_name: string;
  prefix: string;
}

export interface MediaWikiBaseConfig {
  connector_name: string;
  language_code: string;
  categories?: string[];
  pages?: string[];
  recurse_depth?: number;
}

export interface MediaWikiConfig extends MediaWikiBaseConfig {
  hostname: string;
}

export interface WikipediaConfig extends MediaWikiBaseConfig {}

export interface IndexAttemptSnapshot {
  id: number;
  status: ValidStatuses | null;
  new_docs_indexed: number;
  docs_removed_from_index: number;
  total_docs_indexed: number;
  error_msg: string | null;
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
  connector: Connector<ConnectorConfigType>;
  credential: Credential<ConnectorCredentialType>;
  public_doc: boolean;
  owner: string;
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

// CREDENTIALS
export interface CredentialBase<T> {
  credential_json: T;
  admin_public: boolean;
}

export interface Credential<T> extends CredentialBase<T> {
  id: number;
  user_id: string | null;
  time_created: string;
  time_updated: string;
}

export interface GithubCredentialJson {
  github_access_token: string;
}

export interface GitlabCredentialJson {
  gitlab_url: string;
  gitlab_access_token: string;
}

export interface ConfluenceCredentialJson {
  confluence_username: string;
  confluence_access_token: string;
}

export interface JiraCredentialJson {
  jira_user_email: string;
  jira_api_token: string;
}

export interface JiraServerCredentialJson {
  jira_api_token: string;
}

export interface ProductboardCredentialJson {
  productboard_access_token: string;
}

export interface GmailCredentialJson {
  gmail_tokens: string;
}

export interface GoogleDriveCredentialJson {
  google_drive_tokens: string;
}

export interface GmailServiceAccountCredentialJson {
  gmail_service_account_key: string;
  gmail_delegated_user: string;
}

export interface GoogleDriveServiceAccountCredentialJson {
  google_drive_service_account_key: string;
  google_drive_delegated_user: string;
}

export interface NotionCredentialJson {
  notion_integration_token: string;
}

export interface HubSpotCredentialJson {
  hubspot_access_token: string;
}

export interface ZendeskCredentialJson {
  zendesk_subdomain: string;
  zendesk_email: string;
  zendesk_token: string;
}

export interface DropboxCredentialJson {
  dropbox_access_token: string;
}

export interface R2CredentialJson {
  account_id: string;
  r2_access_key_id: string;
  r2_secret_access_key: string;
}

export interface S3CredentialJson {
  aws_access_key_id: string;
  aws_secret_access_key: string;
}

export interface GCSCredentialJson {
  access_key_id: string;
  secret_access_key: string;
}

export interface OCICredentialJson {
  namespace: string;
  region: string;
  access_key_id: string;
  secret_access_key: string;
}

export interface SalesforceCredentialJson {
  sf_username: string;
  sf_password: string;
  sf_security_token: string;
}

export interface SharepointCredentialJson {
  sp_client_id: string;
  sp_client_secret: string;
  sp_directory_id: string;
}

export interface TeamsCredentialJson {
  teams_client_id: string;
  teams_client_secret: string;
  teams_directory_id: string;
}

export interface MediaWikiCredentialJson {}
export interface WikipediaCredentialJson extends MediaWikiCredentialJson {}

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
  groups: number[];
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

export interface MinimalWorkspaceSnapshot {
  id: number;
  workspace_name: string;
}

/* EE Only Types */
export interface Teamspace {
  id: number;
  name: string;
  users: User[];
  cc_pairs: CCPairDescriptor<any, any>[];
  document_sets: DocumentSet[];
  assistants: Assistant[];
  is_up_to_date: boolean;
  is_up_for_deletion: boolean;
}

export interface MinimalTeamspaceSnapshot {
  id: number;
  name: string;
}

export interface TeamspaceChatData extends Teamspace {
  chat_sessions: ChatSession[];
  workspace: MinimalWorkspaceSnapshot[];
}
