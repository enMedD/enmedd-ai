"use client";

import { ThreeDotsLoader } from "@/components/Loading";
import { AdminPageTitle } from "@/components/admin/Title";
import { KeyIcon } from "@/components/icons/icons";
import { errorHandlingFetcher } from "@/lib/fetcher";
import { ErrorCallout } from "@/components/ErrorCallout";
import useSWR, { mutate } from "swr";
import { Spinner } from "@/components/Spinner";
import { deleteApiKey, regenerateApiKey } from "./lib";
import { Button } from "@/components/ui/button";
import { usePopup } from "@/components/admin/connectors/Popup";
import { useState } from "react";
import { Title } from "@tremor/react";
import { DeleteButton } from "@/components/DeleteButton";
import { FiCopy, FiEdit2, FiRefreshCw, FiX } from "react-icons/fi";
import { Modal } from "@/components/Modal";
import { EnmeddApiKeyForm } from "./EnmeddApiKeyForm";
import { APIKey } from "./types";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Check, Copy, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CustomModal } from "@/components/CustomModal";
import { Divider } from "@/components/Divider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_KEY_TEXT = `
API Keys allow you to access Arnold AI APIs programmatically. Click the button below to generate a new API Key.
`;

function NewApiKeyModal({
  apiKey,
  onClose,
}: {
  apiKey: string;
  onClose: () => void;
}) {
  const [isCopyClicked, setIsCopyClicked] = useState(false);

  return (
    <div className="h-full">
      <div className="flex pt-2 pb-10">
        <b className="my-auto break-all">{apiKey}</b>
        <CustomTooltip
          trigger={
            <Button
              onClick={() => {
                setIsCopyClicked(true);
                navigator.clipboard.writeText(apiKey);
                setTimeout(() => {
                  setIsCopyClicked(false);
                }, 2000);
              }}
              variant="ghost"
              size="icon"
              className="ml-2"
            >
              {isCopyClicked ? <Check size="16" /> : <Copy size="16" />}
            </Button>
          }
        >
          {isCopyClicked ? "Copied" : "Copy"}
        </CustomTooltip>
      </div>
    </div>
  );
}

function Main() {
  const { toast } = useToast();
  const {
    data: apiKeys,
    isLoading,
    error,
  } = useSWR<APIKey[]>("/api/admin/api-key", errorHandlingFetcher);

  const [fullApiKey, setFullApiKey] = useState<string | null>(null);
  const [keyIsGenerating, setKeyIsGenerating] = useState(false);
  const [showCreateUpdateForm, setShowCreateUpdateForm] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<APIKey | undefined>();

  const handleEdit = (apiKey: APIKey) => {
    setSelectedApiKey(apiKey);
    setShowCreateUpdateForm(true);
  };

  const isUpdate = selectedApiKey !== undefined;

  if (isLoading) {
    return <ThreeDotsLoader />;
  }

  if (!apiKeys || error) {
    return (
      <ErrorCallout
        errorTitle="Failed to fetch API Keys"
        errorMsg={error?.info?.detail || error.toString()}
      />
    );
  }

  const newApiKeyButton = (
    <Button className="mt-4" onClick={() => setShowCreateUpdateForm(true)}>
      Create API Key
    </Button>
  );

  if (apiKeys.length === 0) {
    return (
      <div>
        <p className="pb-4">{API_KEY_TEXT}</p>

        <CustomModal
          trigger={newApiKeyButton}
          onClose={() => setShowCreateUpdateForm(false)}
          open={showCreateUpdateForm}
          title={isUpdate ? "Update API Key" : "Create a new API Key"}
          description="Choose a memorable name for your API key. This is optional and can be added or changed later."
        >
          <EnmeddApiKeyForm
            onCreateApiKey={(apiKey) => setFullApiKey(apiKey.api_key)}
            onClose={() => {
              setShowCreateUpdateForm(false);
              setSelectedApiKey(undefined);
              mutate("/api/admin/api-key");
            }}
            apiKey={selectedApiKey}
          />
        </CustomModal>
      </div>
    );
  }

  return (
    <div>
      {fullApiKey && (
        <CustomModal
          trigger={null}
          onClose={() => setFullApiKey(null)}
          open={Boolean(fullApiKey)}
          title="New API Key"
          description="Make sure you copy your new API key. You won’t be able to see this key
          again."
        >
          <NewApiKeyModal
            apiKey={fullApiKey}
            onClose={() => setFullApiKey(null)}
          />
        </CustomModal>
      )}

      {keyIsGenerating && <Spinner />}

      <p>{API_KEY_TEXT}</p>

      <CustomModal
        trigger={newApiKeyButton}
        onClose={() => setShowCreateUpdateForm(false)}
        open={showCreateUpdateForm}
        title={isUpdate ? "Update API Key" : "Create a new API Key"}
        description="Choose a memorable name for your API key. This is optional and can be added or changed later."
      >
        <EnmeddApiKeyForm
          onCreateApiKey={(apiKey) => setFullApiKey(apiKey.api_key)}
          onClose={() => {
            setShowCreateUpdateForm(false);
            setSelectedApiKey(undefined);
            mutate("/api/admin/api-key");
          }}
          apiKey={selectedApiKey}
        />
      </CustomModal>

      <Divider />

      <h3 className="pb-4 mt-6">Existing API Keys</h3>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Regenerate</TableHead>
                <TableHead>Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((apiKey) => (
                <TableRow key={apiKey.api_key_id}>
                  <TableCell>
                    <CustomTooltip
                      trigger={
                        <div
                          className="flex items-center w-full gap-2 cursor-pointer"
                          onClick={() => handleEdit(apiKey)}
                        >
                          <Pencil size={16} className="shrink-0" />

                          <p className="w-full truncate mr-5">
                            {apiKey.api_key_name || <i>null</i>}
                          </p>
                        </div>
                      }
                      asChild
                      align="start"
                    >
                      {apiKey.api_key_name || <i>null</i>}
                    </CustomTooltip>
                  </TableCell>
                  <TableCell className="max-w-64">
                    {apiKey.api_key_display}
                  </TableCell>
                  <TableCell className="max-w-64">
                    {apiKey.api_key_role === "admin" ? (
                      <Badge>ADMIN</Badge>
                    ) : (
                      <Badge variant="secondary">USER</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        setKeyIsGenerating(true);
                        const response = await regenerateApiKey(apiKey);
                        setKeyIsGenerating(false);
                        if (!response.ok) {
                          const errorMsg = await response.text();
                          toast({
                            title: "Regeneration Failed",
                            description: `Failed to regenerate API Key: ${errorMsg}`,
                            variant: "destructive",
                          });
                          return;
                        }
                        const newKey = (await response.json()) as APIKey;
                        setFullApiKey(newKey.api_key);
                        mutate("/api/admin/api-key");
                      }}
                    >
                      <FiRefreshCw className="my-auto mr-1" />
                      Refresh
                    </Button>
                  </TableCell>
                  <TableCell>
                    <DeleteButton
                      onClick={async () => {
                        const response = await deleteApiKey(apiKey.api_key_id);
                        if (!response.ok) {
                          const errorMsg = await response.text();
                          toast({
                            title: "Deletion Failed",
                            description: `Failed to delete API Key: ${errorMsg}`,
                            variant: "destructive",
                          });
                          return;
                        }
                        mutate("/api/admin/api-key");
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <div className="container mx-auto">
      <AdminPageTitle title="API Keys" icon={<KeyIcon size={32} />} />

      <Main />
    </div>
  );
}
