import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface CustomModalProps {
  children: React.ReactNode;
  trigger: string | React.ReactNode;
  onClose?: () => void;
  open?: boolean;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export function CustomModal({
  children,
  trigger,
  onClose,
  open,
  title,
  description,
  className,
  headerClassName,
}: CustomModalProps) {
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={className}>
        <DialogHeader className={`pb-8 ${headerClassName}`}>
          <DialogTitle className="w-3/4">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-base">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children}
      </DialogContent>
    </Dialog>
  );
}
