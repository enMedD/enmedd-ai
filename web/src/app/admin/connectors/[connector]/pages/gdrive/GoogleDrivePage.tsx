"use client";

import React from "react";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { FetchError, errorHandlingFetcher } from "@/lib/fetcher";
import { ErrorCallout } from "@/components/ErrorCallout";
import { Loading } from "@/components/Loading";
import { ConnectorIndexingStatus } from "@/lib/types";
import { usePublicCredentials } from "@/lib/hooks";
import { Title } from "@tremor/react";
import { DriveJsonUploadSection, DriveOAuthSection } from "./Credential";
import {
  Credential,
  GoogleDriveCredentialJson,
  GoogleDriveServiceAccountCredentialJson,
} from "@/lib/connectors/credentials";
import { GoogleDriveConfig } from "@/lib/connectors/connectors";
import { useUser } from "@/components/user/UserProvider";
import { useConnectorCredentialIndexingStatus } from "@/lib/hooks";
import { useParams } from "next/navigation";

const GDriveMain = ({}: {}) => {
  const { teamspaceId } = useParams();
  const { isLoadingUser, isAdmin } = useUser();

  const {
    data: appCredentialData,
    isLoading: isAppCredentialLoading,
    error: isAppCredentialError,
  } = useSWR<{ client_id: string }, FetchError>(
    "/api/manage/admin/connector/google-drive/app-credential",
    errorHandlingFetcher
  );

  const {
    data: serviceAccountKeyData,
    isLoading: isServiceAccountKeyLoading,
    error: isServiceAccountKeyError,
  } = useSWR<{ service_account_email: string }, FetchError>(
    "/api/manage/admin/connector/google-drive/service-account-key",
    errorHandlingFetcher
  );

  const {
    data: connectorIndexingStatuses,
    isLoading: isConnectorIndexingStatusesLoading,
    error: connectorIndexingStatusesError,
  } = useConnectorCredentialIndexingStatus(undefined, false, teamspaceId);
  const {
    data: credentialsData,
    isLoading: isCredentialsLoading,
    error: credentialsError,
    refreshCredentials,
  } = usePublicCredentials();

  const appCredentialSuccessfullyFetched =
    appCredentialData ||
    (isAppCredentialError && isAppCredentialError.status === 404);
  const serviceAccountKeySuccessfullyFetched =
    serviceAccountKeyData ||
    (isServiceAccountKeyError && isServiceAccountKeyError.status === 404);

  if (isLoadingUser) {
    return <></>;
  }

  if (
    (!appCredentialSuccessfullyFetched && isAppCredentialLoading) ||
    (!serviceAccountKeySuccessfullyFetched && isServiceAccountKeyLoading) ||
    (!connectorIndexingStatuses && isConnectorIndexingStatusesLoading) ||
    (!credentialsData && isCredentialsLoading)
  ) {
    return (
      <div className="mx-auto">
        <Loading />
      </div>
    );
  }

  if (credentialsError || !credentialsData) {
    return <ErrorCallout errorTitle="Failed to load credentials." />;
  }

  if (connectorIndexingStatusesError || !connectorIndexingStatuses) {
    return <ErrorCallout errorTitle="Failed to load connectors." />;
  }

  if (
    !appCredentialSuccessfullyFetched ||
    !serviceAccountKeySuccessfullyFetched
  ) {
    return (
      <ErrorCallout errorTitle="Error loading Google Drive app credentials. Contact an administrator." />
    );
  }

  const googleDrivePublicCredential:
    | Credential<GoogleDriveCredentialJson>
    | undefined = credentialsData.find(
    (credential) =>
      credential.credential_json?.google_drive_tokens && credential.admin_public
  );
  const googleDriveServiceAccountCredential:
    | Credential<GoogleDriveServiceAccountCredentialJson>
    | undefined = credentialsData.find(
    (credential) => credential.credential_json?.google_drive_service_account_key
  );

  const googleDriveConnectorIndexingStatuses: ConnectorIndexingStatus<
    GoogleDriveConfig,
    GoogleDriveCredentialJson
  >[] = connectorIndexingStatuses.filter(
    (connectorIndexingStatus) =>
      connectorIndexingStatus.connector.source === "google_drive"
  );

  return (
    <>
      <Title className="mb-2 mt-6 ml-auto mr-auto">
        Step 1: Provide your Credentials
      </Title>
      <DriveJsonUploadSection
        appCredentialData={appCredentialData}
        serviceAccountCredentialData={serviceAccountKeyData}
        isAdmin={isAdmin}
      />

      {isAdmin && (
        <>
          <Title className="mb-2 mt-6 ml-auto mr-auto">
            Step 2: Authenticate with Arnold AI
          </Title>
          <DriveOAuthSection
            refreshCredentials={refreshCredentials}
            googleDrivePublicCredential={googleDrivePublicCredential}
            googleDriveServiceAccountCredential={
              googleDriveServiceAccountCredential
            }
            appCredentialData={appCredentialData}
            serviceAccountKeyData={serviceAccountKeyData}
            connectorExists={googleDriveConnectorIndexingStatuses.length > 0}
          />
        </>
      )}
    </>
  );
};

export default GDriveMain;
