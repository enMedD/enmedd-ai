export const ModalWrapper = ({
  children,
  bgClassName,
  modalClassName,
  onClose,
}: {
  children: JSX.Element;
  bgClassName?: string;
  modalClassName?: string;
  onClose?: () => void;
}) => {
  return (
    <div
      onClick={() => onClose && onClose()}
      className={
        "fixed inset-0 bg-background-inverted bg-opacity-30 backdrop-blur-sm " +
        "flex items-center justify-center z-modal " +
        (bgClassName || "")
      }
    >
      <div
        onClick={(e) => {
          if (onClose) {
            e.stopPropagation();
          }
        }}
        className={
          "bg-background  p-8 rounded w-3/4 max-w-3xl shadow " +
          (modalClassName || "")
        }
      >
        {children}
      </div>
    </div>
  );
};
