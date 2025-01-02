import { useState } from "react";
import { useSWRConfig } from "swr";
import { useRouter } from "next/navigation";
import { adminDeleteCredential } from "@/lib/credential";
import { setupGoogleDriveOAuth } from "@/lib/googleDrive";
import { GOOGLE_DRIVE_AUTH_IS_ADMIN_COOKIE_NAME } from "@/lib/constants";
import Cookies from "js-cookie";
import { InputForm } from "@/components/admin/connectors/Field";
import {
  Credential,
  GoogleDriveCredentialJson,
  GoogleDriveServiceAccountCredentialJson,
} from "@/lib/connectors/credentials";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { DATA_SOURCE_ERROR_MESSAGES } from "@/constants/error";
import { DATA_SOURCE_SUCCESS_MESSAGES } from "@/constants/success";

type GoogleDriveCredentialJsonTypes = "authorized_user" | "service_account";

export const DriveJsonUpload = () => {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const [credentialJsonStr, setCredentialJsonStr] = useState<
    string | undefined
  >();
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="w-full space-y-4">
        <label htmlFor="file-upload" className="relative cursor-pointer">
          <div className="flex flex-col items-center justify-center w-full h-40 gap-4 p-4 rounded-md shadow-md bg-background sm:w-96">
            <Upload size={32} />
            <p>Browse Drag & drop files</p>
          </div>
          <input
            className="absolute inset-0 opacity-0 cursor-pointer"
            type="file"
            accept=".json"
            onChange={(event) => {
              if (!event.target.files) {
                return;
              }
              const file = event.target.files[0];
              const reader = new FileReader();
              setSelectedFileName(file.name);

              reader.onload = function (loadEvent) {
                if (!loadEvent?.target?.result) {
                  return;
                }
                const fileContents = loadEvent.target.result;
                setCredentialJsonStr(fileContents as string);
              };

              reader.readAsText(file);
            }}
          />
        </label>

        {selectedFileName && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Selected file:{" "}
            <span className="font-semibold">{selectedFileName}</span>
          </p>
        )}
      </div>

      <Button
        disabled={!credentialJsonStr}
        onClick={async () => {
          // check if the JSON is a app credential or a service account credential
          let credentialFileType: GoogleDriveCredentialJsonTypes;
          try {
            const appCredentialJson = JSON.parse(credentialJsonStr!);
            if (appCredentialJson.web) {
              credentialFileType = "authorized_user";
            } else if (appCredentialJson.type === "service_account") {
              credentialFileType = "service_account";
            } else {
              throw new Error(
                "Unknown credential type, expected one of 'OAuth Web application' or 'Service Account'"
              );
            }
          } catch (e) {
            toast({
              title: DATA_SOURCE_ERROR_MESSAGES.INVALID_FILE.title,
              description:
                DATA_SOURCE_ERROR_MESSAGES.INVALID_FILE.description(e),
              variant: "destructive",
            });
            return;
          }

          if (credentialFileType === "authorized_user") {
            const response = await fetch(
              "/api/manage/admin/connector/google-drive/app-credential",
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: credentialJsonStr,
              }
            );
            if (response.ok) {
              toast({
                title: DATA_SOURCE_SUCCESS_MESSAGES.APP_CREDENTIAL.title,
                description:
                  DATA_SOURCE_SUCCESS_MESSAGES.APP_CREDENTIAL.description,
                variant: "success",
              });
            } else {
              const errorMsg = await response.text();
              toast({
                title: DATA_SOURCE_ERROR_MESSAGES.APP_CREDENTIAL.title,
                description:
                  DATA_SOURCE_ERROR_MESSAGES.APP_CREDENTIAL.description(
                    errorMsg
                  ),
                variant: "destructive",
              });
            }
            mutate("/api/manage/admin/connector/google-drive/app-credential");
          }

          if (credentialFileType === "service_account") {
            const response = await fetch(
              "/api/manage/admin/connector/google-drive/service-account-key",
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: credentialJsonStr,
              }
            );
            if (response.ok) {
              toast({
                title: DATA_SOURCE_SUCCESS_MESSAGES.APP_CREDENTIAL.title,
                description:
                  DATA_SOURCE_SUCCESS_MESSAGES.APP_CREDENTIAL.description,
                variant: "success",
              });
            } else {
              const errorMsg = await response.text();
              toast({
                title: DATA_SOURCE_ERROR_MESSAGES.APP_CREDENTIAL.title,
                description:
                  DATA_SOURCE_ERROR_MESSAGES.APP_CREDENTIAL.description(
                    errorMsg
                  ),
                variant: "destructive",
              });
            }
            mutate(
              "/api/manage/admin/connector/google-drive/service-account-key"
            );
          }
        }}
      >
        Upload
      </Button>
    </div>
  );
};

interface DriveJsonUploadSectionProps {
  appCredentialData?: { client_id: string };
  serviceAccountCredentialData?: { service_account_email: string };
  isAdmin: boolean;
}

export const DriveJsonUploadSection = ({
  appCredentialData,
  serviceAccountCredentialData,
  isAdmin,
}: DriveJsonUploadSectionProps) => {
  const { mutate } = useSWRConfig();
  const { toast } = useToast();

  if (serviceAccountCredentialData?.service_account_email) {
    return (
      <div className="mt-2 text-sm">
        <div>
          Found existing service account key with the following <b>Email:</b>
          <p className="mt-1 italic">
            {serviceAccountCredentialData.service_account_email}
          </p>
        </div>
        {isAdmin ? (
          <>
            <div className="mt-4 mb-1">
              If you want to update these credentials, delete the existing
              credentials through the button below, and then upload a new
              credentials JSON.
            </div>
            <Button
              onClick={async () => {
                const response = await fetch(
                  "/api/manage/admin/connector/google-drive/service-account-key",
                  {
                    method: "DELETE",
                  }
                );
                if (response.ok) {
                  mutate(
                    "/api/manage/admin/connector/google-drive/service-account-key"
                  );
                  toast({
                    title:
                      DATA_SOURCE_SUCCESS_MESSAGES.DELETE_SERVICE_ACCOUNT_KEY
                        .title,
                    description:
                      DATA_SOURCE_SUCCESS_MESSAGES.DELETE_SERVICE_ACCOUNT_KEY
                        .description,
                    variant: "success",
                  });
                } else {
                  const errorMsg = await response.text();
                  toast({
                    title:
                      DATA_SOURCE_ERROR_MESSAGES.DELETE_SERVICE_ACCOUNT_KEY
                        .title,
                    description:
                      DATA_SOURCE_ERROR_MESSAGES.DELETE_SERVICE_ACCOUNT_KEY.description(
                        errorMsg
                      ),
                    variant: "destructive",
                  });
                }
              }}
              variant="destructive"
            >
              Delete
            </Button>
          </>
        ) : (
          <>
            <div className="mt-4 mb-1">
              To change these credentials, please contact an administrator.
            </div>
          </>
        )}
      </div>
    );
  }

  if (appCredentialData?.client_id) {
    return (
      <div className="mt-2 text-sm">
        <div>
          Found existing app credentials with the following <b>Client ID:</b>
          <p className="mt-1 italic">{appCredentialData.client_id}</p>
        </div>
        {isAdmin ? (
          <>
            <div className="mt-4 mb-1">
              If you want to update these credentials, delete the existing
              credentials through the button below, and then upload a new
              credentials JSON.
            </div>
            <Button
              variant="destructive"
              onClick={async () => {
                const response = await fetch(
                  "/api/manage/admin/connector/google-drive/app-credential",
                  {
                    method: "DELETE",
                  }
                );
                if (response.ok) {
                  mutate(
                    "/api/manage/admin/connector/google-drive/app-credential"
                  );
                  toast({
                    title:
                      DATA_SOURCE_SUCCESS_MESSAGES.CREDENTIAL_DELETION.title,
                    description:
                      DATA_SOURCE_SUCCESS_MESSAGES.CREDENTIAL_DELETION
                        .description,
                    variant: "success",
                  });
                } else {
                  const errorMsg = await response.text();
                  toast({
                    title: DATA_SOURCE_ERROR_MESSAGES.CREDENTIAL_DELETION.title,
                    description:
                      DATA_SOURCE_ERROR_MESSAGES.CREDENTIAL_DELETION.description(
                        errorMsg
                      ),
                    variant: "destructive",
                  });
                }
              }}
            >
              Delete
            </Button>
          </>
        ) : (
          <div className="mt-4 mb-1">
            To change these credentials, please contact an administrator.
          </div>
        )}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mt-2">
        <p className="mb-2 text-sm">
          Curators are unable to set up the google drive credentials. To add a
          Google Drive connector, please contact an administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="mb-2 text-sm">
        Follow the guide{" "}
        <a className="text-link" target="_blank" href="#" rel="noopener">
          here
        </a>{" "}
        to either (1) setup a google OAuth App in your company workspace or (2)
        create a Service Account.
        <br />
        <br />
        Download the credentials JSON if choosing option (1) or the Service
        Account key JSON if chooosing option (2), and upload it here.
      </p>
      <DriveJsonUpload />
    </div>
  );
};

interface DriveCredentialSectionProps {
  googleDrivePublicCredential?: Credential<GoogleDriveCredentialJson>;
  googleDriveServiceAccountCredential?: Credential<GoogleDriveServiceAccountCredentialJson>;
  serviceAccountKeyData?: { service_account_email: string };
  appCredentialData?: { client_id: string };
  refreshCredentials: () => void;
  connectorExists: boolean;
}

const formSchema = z.object({
  google_drive_delegated_user: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const DriveOAuthSection = ({
  googleDrivePublicCredential,
  googleDriveServiceAccountCredential,
  serviceAccountKeyData,
  appCredentialData,
  refreshCredentials,
  connectorExists,
}: DriveCredentialSectionProps) => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      google_drive_delegated_user: "",
    },
  });

  const existingCredential =
    googleDrivePublicCredential || googleDriveServiceAccountCredential;
  if (existingCredential) {
    return (
      <>
        <p className="mb-2 text-sm">
          <i>Existing credential already setup</i>
        </p>
        <Button
          variant="destructive"
          onClick={async () => {
            if (connectorExists) {
              toast({
                title: DATA_SOURCE_ERROR_MESSAGES.ACCESS_REVOKE.title,
                description:
                  DATA_SOURCE_ERROR_MESSAGES.ACCESS_REVOKE.description,
                variant: "destructive",
              });
              return;
            }

            await adminDeleteCredential(existingCredential.id);
            toast({
              title: DATA_SOURCE_SUCCESS_MESSAGES.ACCESS_REVOKE.title,
              description:
                DATA_SOURCE_SUCCESS_MESSAGES.ACCESS_REVOKE.description,
              variant: "success",
            });
            refreshCredentials();
          }}
        >
          Revoke Access
        </Button>
      </>
    );
  }

  const onSubmit = async (values: FormValues) => {
    const response = await fetch(
      "/api/manage/admin/connector/google-drive/service-account-credential",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          google_drive_delegated_user: values.google_drive_delegated_user,
        }),
      }
    );

    if (response.ok) {
      toast({
        title: DATA_SOURCE_SUCCESS_MESSAGES.CREATE_SERVICE_ACCOUNT_KEY.title,
        description:
          DATA_SOURCE_SUCCESS_MESSAGES.CREATE_SERVICE_ACCOUNT_KEY.description,
        variant: "success",
      });
    } else {
      const errorMsg = await response.text();
      toast({
        title: DATA_SOURCE_ERROR_MESSAGES.CREATE_SERVICE_ACCOUNT_KEY.title,
        description:
          DATA_SOURCE_ERROR_MESSAGES.CREATE_SERVICE_ACCOUNT_KEY.description(
            errorMsg
          ),
        variant: "destructive",
      });
    }
    refreshCredentials();
  };

  if (serviceAccountKeyData?.service_account_email) {
    return (
      <div>
        <p className="mb-6 text-sm">
          When using a Google Drive Service Account, you can either have Arnold
          AI act as the service account itself OR you can specify an account for
          the service account to impersonate.
          <br />
          <br />
          If you want to use the service account itself, leave the{" "}
          <b>&apos;User email to impersonate&apos;</b> field blank when
          submitting. If you do choose this option, make sure you have shared
          the documents you want to index with the service account.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <InputForm
              formControl={form.control}
              name="google_drive_delegated_user"
              label="[Optional] User email to impersonate:"
              description="If left blank, Arnold AI will use the service account itself."
            />

            <div className="flex">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Create Credential
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

  if (appCredentialData?.client_id) {
    return (
      <div className="mb-4 text-sm">
        <p className="mb-2">
          Next, you must provide credentials via OAuth. This gives us read
          access to the docs you have access to in your google drive account.
        </p>
        <Button
          onClick={async () => {
            const [authUrl, errorMsg] = await setupGoogleDriveOAuth({
              isAdmin: true,
            });
            if (authUrl) {
              // cookie used by callback to determine where to finally redirect to
              Cookies.set(GOOGLE_DRIVE_AUTH_IS_ADMIN_COOKIE_NAME, "true", {
                path: "/",
              });
              router.push(authUrl);
              return;
            }

            toast({
              title: DATA_SOURCE_ERROR_MESSAGES.AUTHENTICATION.title,
              description:
                DATA_SOURCE_ERROR_MESSAGES.AUTHENTICATION.description(errorMsg),
              variant: "destructive",
            });
          }}
        >
          Authenticate with Google Drive
        </Button>
      </div>
    );
  }

  // case where no keys have been uploaded in step 1
  return (
    <p className="text-sm">
      Please upload either a OAuth Client Credential JSON or a Google Drive
      Service Account Key JSON in Step 1 before moving onto Step 2.
    </p>
  );
};
