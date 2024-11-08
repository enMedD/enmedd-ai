import { BasicClickable } from "../BasicClickable";
import { FiTrash } from "react-icons/fi";
import { CustomModal } from "../CustomModal";

export const DeleteEntityModal = ({
  onClose,
  onSubmit,
  entityType,
  entityName,
  additionalDetails,
  showDeleteModel,
}: {
  entityType: string;
  entityName: string;
  onClose: () => void;
  onSubmit: () => void;
  additionalDetails?: string;
  showDeleteModel?: boolean;
}) => {
  return (
    <CustomModal
      onClose={onClose}
      title={`Delete ${entityType}?`}
      trigger={null}
      open={showDeleteModel}
    >
      <>
        <div className="flex mb-4">
          <h2 className="my-auto text-2xl font-bold"></h2>
        </div>
        <p className="mb-4">
          Click below to confirm that you want to delete{" "}
          <b>&quot;{entityName}&quot;</b>
        </p>
        {additionalDetails && <p className="mb-4">{additionalDetails}</p>}
        <div className="flex">
          <div className="mx-auto">
            <BasicClickable onClick={onSubmit}>
              <div className="flex mx-2">
                <FiTrash className="my-auto mr-2" />
                Delete
              </div>
            </BasicClickable>
          </div>
        </div>
      </>
    </CustomModal>
  );
};
