import { useState, useEffect } from "react";
import { CustomModal } from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import { CCPairFullInfo } from "./[ccPairId]/types";
import DocViewer, {
  DocViewerRenderers,
  IDocument,
} from "@cyntler/react-doc-viewer";
import { buildConfigEntries } from "./[ccPairId]/ConfigDisplay";
import { Loading } from "@/components/Loading";

function getFileType(fileName: string): string | undefined {
  const fileExtension = fileName.split(".").pop()?.toLowerCase();
  const fileTypes: Record<string, string> = {
    doc: "Word Document (Legacy)",
    docx: "Word Document",
    ppt: "PowerPoint Presentation (Legacy)",
    pptx: "PowerPoint Presentation",
    xls: "Excel Spreadsheet (Legacy)",
    xlsx: "Excel Spreadsheet",
  };

  return fileTypes[fileExtension || ""];
}

export function DocumentViewerModal({
  ccPair,
  teamspaceId,
}: {
  ccPair: CCPairFullInfo;
  teamspaceId?: string | string[];
}) {
  const [openDocumentModal, setOpenDocumentModal] = useState(false);
  const [documentData, setDocumentData] = useState<IDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const documents =
    ccPair.connector.connector_specific_config.file_locations.map(
      (location: string) => ({
        location,
      })
    );

  useEffect(() => {
    if (!openDocumentModal) return;

    async function fetchDocument() {
      setLoading(true);

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

        const fileType = getFileType(fileLocation);

        // Only include the fileType if it is a supported type
        const document: IDocument = {
          uri: fileURL,
          fileName: fileLocation,
          ...(fileType ? { fileType } : {}), // Conditionally include fileType
        };

        setDocumentData([document]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
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
        {loading ? (
          <Loading />
        ) : (
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
        )}
      </CustomModal>
    </div>
  );
}
