import {
  AxeroIcon,
  BookstackIcon,
  ClickupIcon,
  ConfluenceIcon,
  DiscourseIcon,
  Document360Icon,
  DropboxIcon,
  FileIcon,
  GithubIcon,
  GitlabIcon,
  GlobeIcon,
  GmailIcon,
  GongIcon,
  GoogleDriveIcon,
  GoogleSitesIcon,
  GuruIcon,
  HubSpotIcon,
  JiraIcon,
  LinearIcon,
  LoopioIcon,
  NotionIcon,
  ProductboardIcon,
  RequestTrackerIcon,
  R2Icon,
  SalesforceIcon,
  SharepointIcon,
  TeamsIcon,
  SlabIcon,
  ZendeskIcon,
  ZulipIcon,
  MediaWikiIcon,
  WikipediaIcon,
  AsanaIcon,
  S3Icon,
  OCIStorageIcon,
  GoogleStorageIcon,
  XenforoIcon,
  GoogleSheetsIcon,
} from "@/components/icons/icons";
import { ValidSources } from "./types";
import {
  EnmeddDocument,
  SourceCategory,
  SourceMetadata,
} from "./search/interfaces";
import { Assistant } from "@/app/admin/assistants/interfaces";

interface PartialSourceMetadata {
  icon: React.FC<{ size?: number; className?: string }>;
  displayName: string;
  category: SourceCategory;
  docs?: string;
}

type SourceMap = {
  [K in ValidSources]: PartialSourceMetadata;
};

const SOURCE_METADATA_MAP: SourceMap = {
  web: {
    icon: GlobeIcon,
    displayName: "Web",
    category: SourceCategory.ImportedKnowledge,
    docs: "https://docs.danswer.dev/connectors/web",
  },
  file: {
    icon: FileIcon,
    displayName: "File",
    category: SourceCategory.ImportedKnowledge,
    docs: "https://docs.danswer.dev/connectors/file",
  },
  gmail: {
    icon: GmailIcon,
    displayName: "Gmail",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/gmail/overview",
  },
  google_drive: {
    icon: GoogleDriveIcon,
    displayName: "Google Drive",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/google_drive/overview",
  },
  github: {
    icon: GithubIcon,
    displayName: "Github",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/github",
  },
  gitlab: {
    icon: GitlabIcon,
    displayName: "Gitlab",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/gitlab",
  },
  confluence: {
    icon: ConfluenceIcon,
    displayName: "Confluence",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/confluence",
  },
  jira: {
    icon: JiraIcon,
    displayName: "Jira",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/jira",
  },
  notion: {
    icon: NotionIcon,
    displayName: "Notion",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/notion",
  },
  zendesk: {
    icon: ZendeskIcon,
    displayName: "Zendesk",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/zendesk",
  },
  gong: {
    icon: GongIcon,
    displayName: "Gong",
    category: SourceCategory.Other,
    docs: "https://docs.danswer.dev/connectors/gong",
  },
  linear: {
    icon: LinearIcon,
    displayName: "Linear",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/linear",
  },
  productboard: {
    icon: ProductboardIcon,
    displayName: "Productboard",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/productboard",
  },
  slab: {
    icon: SlabIcon,
    displayName: "Slab",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/slab",
  },
  zulip: {
    icon: ZulipIcon,
    displayName: "Zulip",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/zulip",
  },
  guru: {
    icon: GuruIcon,
    displayName: "Guru",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/guru",
  },
  hubspot: {
    icon: HubSpotIcon,
    displayName: "HubSpot",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/hubspot",
  },
  document360: {
    icon: Document360Icon,
    displayName: "Document360",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/document360",
  },
  bookstack: {
    icon: BookstackIcon,
    displayName: "BookStack",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/bookstack",
  },
  google_sites: {
    icon: GoogleSitesIcon,
    displayName: "Google Sites",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/google_sites",
  },
  loopio: {
    icon: LoopioIcon,
    displayName: "Loopio",
    category: SourceCategory.Other,
  },
  dropbox: {
    icon: DropboxIcon,
    displayName: "Dropbox",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/dropbox",
  },
  salesforce: {
    icon: SalesforceIcon,
    displayName: "Salesforce",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/salesforce",
  },
  sharepoint: {
    icon: SharepointIcon,
    displayName: "Sharepoint",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/sharepoint",
  },
  teams: {
    icon: TeamsIcon,
    displayName: "Teams",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/teams",
  },
  discourse: {
    icon: DiscourseIcon,
    displayName: "Discourse",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/discourse",
  },
  axero: {
    icon: AxeroIcon,
    displayName: "Axero",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/axero",
  },
  wikipedia: {
    icon: WikipediaIcon,
    displayName: "Wikipedia",
    category: SourceCategory.ImportedKnowledge,
    docs: "https://docs.danswer.dev/connectors/wikipedia",
  },
  asana: {
    icon: AsanaIcon,
    displayName: "Asana",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/asana",
  },
  mediawiki: {
    icon: MediaWikiIcon,
    displayName: "MediaWiki",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/mediawiki",
  },
  requesttracker: {
    icon: RequestTrackerIcon,
    displayName: "Request Tracker",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/requesttracker",
  },
  clickup: {
    icon: ClickupIcon,
    displayName: "Clickup",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/clickup",
  },
  s3: {
    icon: S3Icon,
    displayName: "S3",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/s3",
  },
  r2: {
    icon: R2Icon,
    displayName: "R2",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/r2",
  },
  oci_storage: {
    icon: OCIStorageIcon,
    displayName: "Oracle Storage",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/oci_storage",
  },
  google_cloud_storage: {
    icon: GoogleStorageIcon,
    displayName: "Google Storage",
    category: SourceCategory.AppConnection,
    docs: "https://docs.danswer.dev/connectors/google_storage",
  },
  google_sheets: {
    icon: GoogleSheetsIcon,
    displayName: "Google Sheets",
    category: SourceCategory.ComingSoon,
  },
  xenforo: {
    icon: XenforoIcon,
    displayName: "Xenforo",
    category: SourceCategory.AppConnection,
  },
  ingestion_api: {
    icon: GlobeIcon,
    displayName: "Ingestion",
    category: SourceCategory.Other,
  },
  // currently used for the Internet Search tool docs, which is why
  // a globe is used
  not_applicable: {
    icon: GlobeIcon,
    displayName: "Not Applicable",
    category: SourceCategory.Other,
  },
} as SourceMap;

function fillSourceMetadata(
  partialMetadata: PartialSourceMetadata,
  internalName: ValidSources
): SourceMetadata {
  return {
    internalName: internalName,
    ...partialMetadata,
    adminUrl: `/admin/connectors/${internalName}`,
  };
}

export function getSourceMetadata(sourceType: ValidSources): SourceMetadata {
  const response = fillSourceMetadata(
    SOURCE_METADATA_MAP[sourceType],
    sourceType
  );

  return response;
}

export function listSourceMetadata(): SourceMetadata[] {
  /* This gives back all the viewable / common sources, primarily for 
  display in the Add Connector page */
  const entries = Object.entries(SOURCE_METADATA_MAP)
    .filter(
      ([source, _]) => source !== "not_applicable" && source != "ingestion_api"
    )
    .map(([source, metadata]) => {
      return fillSourceMetadata(metadata, source as ValidSources);
    });
  return entries;
}

export function getSourceDocLink(sourceType: ValidSources): string | null {
  return SOURCE_METADATA_MAP[sourceType].docs || null;
}
export const isValidSource = (sourceType: string) => {
  return Object.keys(SOURCE_METADATA_MAP).includes(sourceType);
};

export function getSourceDisplayName(sourceType: ValidSources): string | null {
  return getSourceMetadata(sourceType).displayName;
}

export function getSourceMetadataForSources(sources: ValidSources[]) {
  return sources.map((source) => getSourceMetadata(source));
}

export function getSourcesForAssistant(assistant: Assistant): ValidSources[] {
  const assistantSources: ValidSources[] = [];
  assistant.document_sets.forEach((documentSet) => {
    documentSet.cc_pair_descriptors.forEach((ccPair) => {
      if (!assistantSources.includes(ccPair.connector.source)) {
        assistantSources.push(ccPair.connector.source);
      }
    });
  });
  return assistantSources;
}
