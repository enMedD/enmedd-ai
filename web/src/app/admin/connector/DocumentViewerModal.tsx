import { useState, useEffect } from "react";
import { CustomModal } from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import { CCPairFullInfo } from "./[ccPairId]/types";
import DocViewer, {
  DocViewerRenderers,
  IDocument,
} from "@cyntler/react-doc-viewer";
import {
  buildConfigEntries,
  convertObjectToString,
} from "./[ccPairId]/ConfigDisplay";

export function DocumentViewerModal({ ccPair }: { ccPair: CCPairFullInfo }) {
  const [openDocumentModal, setOpenDocumentModal] = useState(false);
  const [documentData, setDocumentData] = useState<IDocument[]>([]);

  const documents =
    ccPair.connector.connector_specific_config.file_locations.map(
      (location: string) => ({
        location,
      })
    );

  const fileLocation = documents[0].location;

  useEffect(() => {
    if (!openDocumentModal) return;

    async function fetchDocument() {
      try {
        const fileLocation = documents[0].location;

        if (!fileLocation) {
          throw new Error("No document found");
        }

        const response = await fetch(
          `/api/document/file?file_name=${fileLocation}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch document");
        }

        const blob = await response.blob();
        const fileURL = URL.createObjectURL(blob);

        setDocumentData([
          {
            uri: fileURL,
            fileName: fileLocation,
          },
        ]);
      } catch (err) {
        console.error(err);
      }
    }

    fetchDocument();
  }, [openDocumentModal, ccPair]);

  const configEntries = Object.entries(
    buildConfigEntries(
      ccPair.connector.connector_specific_config,
      ccPair.connector.source
    )
  );
  if (!configEntries.length) {
    return null;
  }

  const modalTitle = configEntries
    .map(([key, value]) => `${Array.isArray(value) ? value.join(", ") : value}`)
    .join(" | ");

  return (
    <div>
      <CustomModal
        open={openDocumentModal}
        onClose={() => setOpenDocumentModal(false)}
        trigger={
          <Button onClick={() => setOpenDocumentModal(true)} variant="outline">
            View
          </Button>
        }
        title={modalTitle}
      >
        <DocViewer
          prefetchMethod="GET"
          documents={documentData}
          pluginRenderers={DocViewerRenderers}
          config={{
            header: {
              disableHeader: true,
            },
          }}
          className="my-doc-viewer-style"
        />
      </CustomModal>
    </div>
  );
}