"use client";

import * as Yup from "yup";
import { TrashIcon, TeamsIcon } from "@/components/icons/icons";
import { errorHandlingFetcher } from "@/lib/fetcher";
import useSWR, { useSWRConfig } from "swr";
import { LoadingAnimation } from "@/components/Loading";
import { HealthCheckBanner } from "@/components/health/healthcheck";
import {
  TeamsConfig,
  TeamsCredentialJson,
  ConnectorIndexingStatus,
  Credential,
} from "@/lib/types"; // Modify or create these types as required
import { adminDeleteCredential, linkCredential } from "@/lib/credential";
import { CredentialForm } from "@/components/admin/connectors/CredentialForm";
import {
  TextFormField,
  TextArrayFieldBuilder,
} from "@/components/admin/connectors/Field";
import { ConnectorsTable } from "@/components/admin/connectors/table/ConnectorsTable";
import { ConnectorForm } from "@/components/admin/connectors/ConnectorForm";
import { usePublicCredentials } from "@/lib/hooks";
import { AdminPageTitle } from "@/components/admin/Title";
import { Text, Title, Button } from "@tremor/react";
import { ErrorCallout } from "@/components/ErrorCallout";
import { Card, CardContent } from "@/components/ui/card";
import { BackButton } from "@/components/BackButton";

const MainSection = () => {
  const { mutate } = useSWRConfig();
  const {
    data: connectorIndexingStatuses,
    isLoading: isConnectorIndexingStatusesLoading,
    error: connectorIndexingStatusesError,
  } = useSWR<ConnectorIndexingStatus<any, any>[]>(
    "/api/manage/admin/connector/indexing-status",
    errorHandlingFetcher
  );

  const {
    data: credentialsData,
    isLoading: isCredentialsLoading,
    error: credentialsError,
    refreshCredentials,
  } = usePublicCredentials();

  if (
    (!connectorIndexingStatuses && isConnectorIndexingStatusesLoading) ||
    (!credentialsData && isCredentialsLoading)
  ) {
    return <LoadingAnimation text="Loading" />;
  }

  if (connectorIndexingStatusesError || !connectorIndexingStatuses) {
    return (
      <ErrorCallout
        errorTitle="Something went wrong :("
        errorMsg={connectorIndexingStatusesError?.info?.detail}
      />
    );
  }

  if (credentialsError || !credentialsData) {
    return (
      <ErrorCallout
        errorTitle="Something went wrong :("
        errorMsg={credentialsError?.info?.detail}
      />
    );
  }

  const teamsConnectorIndexingStatuses: ConnectorIndexingStatus<
    TeamsConfig,
    TeamsCredentialJson
  >[] = connectorIndexingStatuses.filter(
    (connectorIndexingStatus) =>
      connectorIndexingStatus.connector.source === "teams"
  );

  const teamsCredential: Credential<TeamsCredentialJson> | undefined =
    credentialsData.find(
      (credential) => credential.credential_json?.teams_client_id
    );

  return (
    <>
      <p className="text-sm">
        The Teams connector allows you to index and search through your Teams
        channels. Once setup, all messages from the channels contained in the
        specified teams will be queryable within enMedD AI.
      </p>

      <h3 className="mt-6 mb-2 ml-auto mr-auto">
        Step 1: Provide Teams credentials
      </h3>
      {teamsCredential ? (
        <>
          <div className="flex mb-1 text-sm">
            <Text className="my-auto">Existing Azure AD Client ID: </Text>
            <Text className="my-auto ml-1 italic">
              {teamsCredential.credential_json.teams_client_id}
            </Text>
            <Button
              className="p-1 ml-1 rounded hover:bg-hover"
              onClick={async () => {
                await adminDeleteCredential(teamsCredential.id);
                refreshCredentials();
              }}
              variant="light"
            >
              <TrashIcon />
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm">
            As a first step, please provide Application (client) ID, Directory
            (tenant) ID, and Client Secret. You can follow the guide{" "}
            <a
              target="_blank"
              href="https://docs.danswer.dev/connectors/teams"
              className="text-link"
            >
              here
            </a>{" "}
            to create an Azure AD application and obtain these values.
          </p>
          <Card className="mt-4">
            <CardContent>
              <CredentialForm<TeamsCredentialJson>
                formBody={
                  <>
                    <TextFormField
                      name="teams_client_id"
                      label="Application (client) ID:"
                    />
                    <TextFormField
                      name="teams_directory_id"
                      label="Directory (tenant) ID:"
                    />
                    <TextFormField
                      name="teams_client_secret"
                      label="Client Secret:"
                      type="password"
                    />
                  </>
                }
                validationSchema={Yup.object().shape({
                  teams_client_id: Yup.string().required(
                    "Please enter your Application (client) ID"
                  ),
                  teams_directory_id: Yup.string().required(
                    "Please enter your Directory (tenant) ID"
                  ),
                  teams_client_secret: Yup.string().required(
                    "Please enter your Client Secret"
                  ),
                })}
                initialValues={{
                  teams_client_id: "",
                  teams_directory_id: "",
                  teams_client_secret: "",
                }}
                onSubmit={(isSuccess) => {
                  if (isSuccess) {
                    refreshCredentials();
                  }
                }}
              />
            </CardContent>
          </Card>
        </>
      )}

      <h3 className="mt-6 mb-2 ml-auto mr-auto">
        Step 2: Manage Teams Connector
      </h3>

      {teamsConnectorIndexingStatuses.length > 0 && (
        <>
          <Text className="mb-2">
            The latest messages from the specified teams are fetched every 10
            minutes.
          </Text>
          <div className="mb-2">
            <ConnectorsTable<TeamsConfig, TeamsCredentialJson>
              connectorIndexingStatuses={teamsConnectorIndexingStatuses}
              liveCredential={teamsCredential}
              getCredential={(credential) =>
                credential.credential_json.teams_directory_id
              }
              onUpdate={() =>
                mutate("/api/manage/admin/connector/indexing-status")
              }
              onCredentialLink={async (connectorId) => {
                if (teamsCredential) {
                  await linkCredential(connectorId, teamsCredential.id);
                  mutate("/api/manage/admin/connector/indexing-status");
                }
              }}
              specialColumns={[
                {
                  header: "Connectors",
                  key: "connectors",
                  getValue: (ccPairStatus) => {
                    const connectorConfig =
                      ccPairStatus.connector.connector_specific_config;
                    return `${connectorConfig.teams}`;
                  },
                },
              ]}
              includeName
            />
          </div>
        </>
      )}

      {teamsCredential ? (
        <Card className="mt-4">
          <CardContent>
            <ConnectorForm<TeamsConfig>
              nameBuilder={(values) =>
                values.teams && values.teams.length > 0
                  ? `Teams-${values.teams.join("-")}`
                  : "Teams"
              }
              ccPairNameBuilder={(values) =>
                values.teams && values.teams.length > 0
                  ? `Teams-${values.teams.join("-")}`
                  : "Teams"
              }
              source="teams"
              inputType="poll"
              // formBody={<></>}
              formBodyBuilder={TextArrayFieldBuilder({
                name: "teams",
                label: "Teams:",
                subtext:
                  "Specify 0 or more Teams to index.  " +
                  "For example, specifying the Team 'Support' for the 'enmedd-ai' Org will cause  " +
                  "us to only index messages sent in channels belonging to the 'Support' Team. " +
                  "If no Teams are specified, all Teams in your organization will be indexed.",
              })}
              validationSchema={Yup.object().shape({
                teams: Yup.array()
                  .of(Yup.string().required("Team names must be strings"))
                  .required(),
              })}
              initialValues={{
                teams: [],
              }}
              credentialId={teamsCredential.id}
              refreshFreq={10 * 60} // 10 minutes
            />
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm">
          Please provide all Azure info in Step 1 first! Once you&apos;re done
          with that, you can then specify which teams you want to make
          searchable.
        </p>
      )}
    </>
  );
};

export default function Page() {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container">
        <BackButton />

        <AdminPageTitle icon={<TeamsIcon size={32} />} title="Teams" />

        <MainSection />
      </div>
    </div>
  );
}
