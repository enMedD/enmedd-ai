import { CustomCheckbox } from "@/components/CustomCheckbox";
import { HoverPopup } from "@/components/HoverPopup";
import { PageSelector } from "@/components/PageSelector";
import { usePopup } from "@/components/admin/connectors/Popup";
import { getErrorMsg } from "@/lib/fetchUtils";
import { DocumentBoostStatus } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";
import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { ScoreSection } from "../ScoreEditor";
import { updateHiddenStatus } from "../lib";
import { numToDisplay } from "./constants";

const IsVisibleSection = ({
  document,
  onUpdate,
}: {
  document: DocumentBoostStatus;
  onUpdate: (response: Response) => void;
}) => {
  return (
    <HoverPopup
      mainContent={
        document.hidden ? (
          <div
            onClick={async () => {
              const response = await updateHiddenStatus(
                document.document_id,
                false
              );
              onUpdate(response);
            }}
            className="flex text-error cursor-pointer hover:bg-hover py-1 px-2 w-fit rounded-full"
          >
            <div className="select-none">Hidden</div>
            <div className="ml-1 my-auto">
              <CustomCheckbox checked={false} />
            </div>
          </div>
        ) : (
          <div
            onClick={async () => {
              const response = await updateHiddenStatus(
                document.document_id,
                true
              );
              onUpdate(response);
            }}
            className="flex cursor-pointer hover:bg-hover py-1 px-2 w-fit rounded-full"
          >
            <div className="my-auto select-none">Visible</div>
            <div className="ml-1 my-auto">
              <CustomCheckbox checked={true} />
            </div>
          </div>
        )
      }
      popupContent={
        <div className="text-xs">
          {document.hidden ? (
            <div className="flex">
              <FiEye className="my-auto mr-1" /> Unhide
            </div>
          ) : (
            <div className="flex">
              <FiEyeOff className="my-auto mr-1" />
              Hide
            </div>
          )}
        </div>
      }
      direction="left"
    />
  );
};

export const DocumentFeedbackTable = ({
  documents,
  refresh,
}: {
  documents: DocumentBoostStatus[];
  refresh: () => void;
}) => {
  const [page, setPage] = useState(1);
  const { popup, setPopup } = usePopup();

  return (
    <div>
      <Table className="overflow-visible">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Document Name</TableHeaderCell>
            <TableHeaderCell>Is Searchable?</TableHeaderCell>
            <TableHeaderCell>Score</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {documents
            .slice((page - 1) * numToDisplay, page * numToDisplay)
            .map((document) => {
              return (
                <TableRow key={document.document_id}>
                  <TableCell className="whitespace-normal break-all">
                    <a
                      className="text-blue-600"
                      href={document.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {document.semantic_id}
                    </a>
                  </TableCell>
                  <TableCell>
                    <IsVisibleSection
                      document={document}
                      onUpdate={async (response) => {
                        if (response.ok) {
                          refresh();
                        } else {
                          setPopup({
                            message: `Error updating hidden status - ${getErrorMsg(
                              response
                            )}`,
                            type: "error",
                          });
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="ml-auto flex w-16">
                      <div
                        key={document.document_id}
                        className="h-10 ml-auto mr-8"
                      >
                        <ScoreSection
                          documentId={document.document_id}
                          initialScore={document.boost}
                          refresh={refresh}
                          setPopup={setPopup}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>

      <div className="mt-3 flex">
        <div className="mx-auto">
          <PageSelector
            totalPages={Math.ceil(documents.length / numToDisplay)}
            currentPage={page}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      </div>
    </div>
  );
};
