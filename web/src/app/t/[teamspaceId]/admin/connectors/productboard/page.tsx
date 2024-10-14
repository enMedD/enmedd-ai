"use client";

import * as Yup from "yup";
import { ProductboardIcon, TrashIcon } from "@/components/icons/icons";
import { TextFormField } from "@/components/admin/connectors/Field";
import { HealthCheckBanner } from "@/components/health/healthcheck";
import { CredentialForm } from "@/components/admin/connectors/CredentialForm";
import {
  ProductboardConfig,
  ConnectorIndexingStatus,
  ProductboardCredentialJson,
  Credential,
} from "@/lib/types";
import useSWR, { useSWRConfig } from "swr";
import { errorHandlingFetcher } from "@/lib/fetcher";
import { ErrorCallout } from "@/components/ErrorCallout";
import { LoadingAnimation } from "@/components/Loading";
import { adminDeleteCredential, linkCredential } from "@/lib/credential";
import { ConnectorForm } from "@/components/admin/connectors/ConnectorForm";
import { ConnectorsTable } from "@/components/admin/connectors/table/ConnectorsTable";
import { usePublicCredentials } from "@/lib/hooks";
import { Text, Title, Button } from "@tremor/react";
import { AdminPageTitle } from "@/components/admin/Title";
import { Card, CardContent } from "@/components/ui/card";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";

const Main = () => {
  const { toast } = useToast();

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
    isValidating: isCredentialsValidating,
    refreshCredentials,
  } = usePublicCredentials();

  if (
    isConnectorIndexingStatusesLoading ||
    isCredentialsLoading ||
    isCredentialsValidating
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

  const productboardConnectorIndexingStatuses: ConnectorIndexingStatus<
    ProductboardConfig,
    ProductboardCredentialJson
  >[] = connectorIndexingStatuses.filter(
    (connectorIndexingStatus) =>
      connectorIndexingStatus.connector.source === "productboard"
  );
  const productboardCredential:
    | Credential<ProductboardCredentialJson>
    | undefined = credentialsData.find(
    (credential) => credential.credential_json?.productboard_access_token
  );

  return (
    <>
      <p className="text-sm mb-6">
        This connector allows you to sync all your <i>Features</i>,{" "}
        <i>Components</i>, <i>Products</i>, and <i>Objectives</i> from
        Productboard into enMedD AI. At this time, the Productboard APIs does
        not support pulling in <i>Releases</i> or <i>Notes</i>.
      </p>

      <h3 className="mb-2 ml-auto mr-auto">Step 1: Provide your Credentials</h3>

      {productboardCredential ? (
        <>
          <div className="flex mb-1 text-sm">
            <Text className="my-auto">Existing Access Token: </Text>
            <Text className="max-w-md my-auto ml-1 italic truncate">
              {
                productboardCredential.credential_json
                  ?.productboard_access_token
              }
            </Text>
            <Button
              className="p-1 ml-1 rounded hover:bg-hover"
              onClick={async () => {
                if (productboardConnectorIndexingStatuses.length > 0) {
                  toast({
                    title: "Cannot Delete Credentials",
                    description:
                      "Please delete all connectors associated with these credentials before proceeding.",
                    variant: "destructive",
                  });
                  return;
                }
                await adminDeleteCredential(productboardCredential.id);
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
            To use the Productboard connector, first follow the guide{" "}
            <a
              className="text-link"
              href="https://developer.productboard.com/#section/Authentication/Public-API-Access-Token"
              target="_blank"
            >
              here
            </a>{" "}
            to generate an Access Token.
          </p>
          <Card className="mt-4">
            <CardContent>
              <CredentialForm<ProductboardCredentialJson>
                formBody={
                  <>
                    <TextFormField
                      name="productboard_access_token"
                      label="Access Token:"
                      type="password"
                    />
                  </>
                }
                validationSchema={Yup.object().shape({
                  productboard_access_token: Yup.string().required(
                    "Please enter your Productboard access token"
                  ),
                })}
                initialValues={{
                  productboard_access_token: "",
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

      <h3 className="mt-6 mb-2 ml-auto mr-auto">Step 2: Start indexing!</h3>
      {productboardCredential ? (
        !productboardConnectorIndexingStatuses.length ? (
          <>
            <Text className="mb-2">
              Click the button below to start indexing! We will pull the latest
              features, components, and products from Productboard every{" "}
              <b>10</b> minutes.
            </Text>
            <div className="flex">
              <ConnectorForm<ProductboardConfig>
                nameBuilder={() => "ProductboardConnector"}
                ccPairNameBuilder={() => "Productboard"}
                source="productboard"
                inputType="poll"
                formBody={null}
                validationSchema={Yup.object().shape({})}
                initialValues={{}}
                refreshFreq={10 * 60} // 10 minutes
                credentialId={productboardCredential.id}
              />
            </div>
          </>
        ) : (
          <>
            <Text className="mb-2">
              Productboard connector is setup! We are pulling the latest
              features, components, and products from Productboard every{" "}
              <b>10</b> minutes.
            </Text>
            <ConnectorsTable<ProductboardConfig, ProductboardCredentialJson>
              connectorIndexingStatuses={productboardConnectorIndexingStatuses}
              liveCredential={productboardCredential}
              getCredential={(credential) => {
                return (
                  <div>
                    <p>
                      {credential.credential_json.productboard_access_token}
                    </p>
                  </div>
                );
              }}
              onCredentialLink={async (connectorId) => {
                if (productboardCredential) {
                  await linkCredential(connectorId, productboardCredential.id);
                  mutate("/api/manage/admin/connector/indexing-status");
                }
              }}
              onUpdate={() =>
                mutate("/api/manage/admin/connector/indexing-status")
              }
            />
          </>
        )
      ) : (
        <>
          <p className="text-sm">
            Please provide your access token in Step 1 first! Once done with
            that, you can then start indexing all your Productboard features,
            components, and products.
          </p>
        </>
      )}
    </>
  );
};

export default function Page() {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container">
        <BackButton />

        <AdminPageTitle
          icon={<ProductboardIcon size={32} />}
          title="Productboard"
        />

        <Main />
      </div>
    </div>
  );
}
