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
  const allFileTypes: Record<string, string> = {
    bmp: "Bitmap Image",
    csv: "CSV File",
    odt: "OpenDocument Text",
    doc: "Word Document (Legacy)",
    docx: "Word Document",
    gif: "GIF Image",
    htm: "HTML File",
    html: "HTML File",
    jpg: "JPEG Image",
    jpeg: "JPEG Image",
    pdf: "PDF Document",
    png: "PNG Image",
    ppt: "PowerPoint Presentation (Legacy)",
    pptx: "PowerPoint Presentation",
    tiff: "TIFF Image",
    txt: "Text File",
    xls: "Excel Spreadsheet (Legacy)",
    xlsx: "Excel Spreadsheet",
    mp4: "MP4 Video",
    webp: "WebP Image",
  };

  return allFileTypes[fileExtension || ""];
}

function getDocSpecificFileType(fileName: string): string | undefined {
  const fileExtension = fileName.split(".").pop()?.toLowerCase();
  const specificFileTypes: Record<string, string> = {
    doc: "Word Document (Legacy)",
    docx: "Word Document",
    ppt: "PowerPoint Presentation (Legacy)",
    pptx: "PowerPoint Presentation",
    xls: "Excel Spreadsheet (Legacy)",
    xlsx: "Excel Spreadsheet",
  };

  return specificFileTypes[fileExtension || ""];
}

async function fetchAndPrepareDocument(
  fileLocation: string,
  title: string
): Promise<IDocument> {
  const allFileType = getFileType(fileLocation);
  const docFileType = getDocSpecificFileType(fileLocation);

  if (!allFileType) {
    throw new Error(
      `Unsupported file type for ${title}. Supported types: bmp, csv, odt, doc, docx, gif, htm, html, jpg, jpeg, pdf, png, ppt, pptx, tiff, txt, xls, xlsx, mp4, webp.`
    );
  }

  const response = await fetch(`/api/document/file?file_name=${fileLocation}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch document");
  }

  const blob = await response.blob();
  const fileURL = URL.createObjectURL(blob);

  return {
    uri: fileURL,
    fileName: fileLocation,
    ...(docFileType ? { fileType: docFileType } : {}), // Conditionally include docFileType
  };
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
  const [error, setError] = useState<string | null>(null);

  const documents =
    ccPair.connector.connector_specific_config.file_locations.map(
      (location: string) => ({
        location,
      })
    );

  const configEntries = Object.entries(
    buildConfigEntries(
      ccPair.connector.connector_specific_config,
      ccPair.connector.source
    )
  );

  if (!configEntries.length) {
    return null;
  }

  const title = configEntries
    .map(([key, value]) => `${Array.isArray(value) ? value.join(", ") : value}`)
    .join(" | ");

  useEffect(() => {
    if (!openDocumentModal) return;

    async function fetchDocument() {
      setLoading(true);
      setError(null);

      try {
        const fileLocation = documents[0].location;

        if (!fileLocation) {
          throw new Error("No document found");
        }

        const document = await fetchAndPrepareDocument(fileLocation, title);

        setDocumentData([document]);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchDocument();
  }, [openDocumentModal, ccPair]);

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
        title={title}
        headerClassName="pb-4"
      >
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="text-destructive-500">{error}</div>
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
