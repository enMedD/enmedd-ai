import { CustomModal } from "@/components/CustomModal";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export const TeamspaceInvite = ({
  children,
  teamspaceId,
  contextMenu,
}: {
  children: React.ReactNode;
  teamspaceId: number;
  contextMenu?: boolean;
}) => {
  const { toast } = useToast();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCopyClicked, setIsCopyClicked] = useState(false);
  const [openInviteModal, setOpenInviteModal] = useState(false);

  const generateInviteLink = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/users/generate-invite-link?teamspace_id=${teamspaceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail?.[0]?.msg || "Failed to generate invite link"
        );
      }

      const data = await response.json();
      setInviteLink(data);
    } catch (err: any) {
      toast({
        title: "Invite Link Generation Failed",
        description:
          err.message || "An error occurred while generating the invite link.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomModal
      trigger={
        <div
          onClick={(e) => {
            e.stopPropagation();
            setOpenInviteModal(true);
            generateInviteLink();
          }}
          className={`w-full ${contextMenu ? "h-full w-full px-2 py-1.5" : ""}`}
        >
          {children}
        </div>
      }
      onClose={() => {
        setOpenInviteModal(false);
      }}
      open={openInviteModal}
      title="Invite Friends to Arnold AI"
      description="Teamspace 1"
      className="lg:max-w-[300px] xl:max-w-[500px]"
      titleClassName="text-base lg:text-xl"
    >
      <Label className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5">
        Share this link to others to grant access to this teamspace
      </Label>
      {loading ? (
        <p className="text-sm h-12 flex items-center gap-2">
          Generating invite link <Loading />
        </p>
      ) : inviteLink ? (
        <div className="p-1 bg-background-subtle rounded-md flex items-center justify-between gap-2">
          <p className="pl-3 text-sm truncate">{inviteLink}</p>
          <div className="w-20 flex justify-end shrink-0">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                setIsCopyClicked(true);
                setTimeout(() => setIsCopyClicked(false), 3000);
              }}
              variant={isCopyClicked ? "success" : "default"}
            >
              {isCopyClicked ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm h-12 flex items-center text-destructive-500">
          No invite link available
        </p>
      )}
      <p className="text-xs pt-1.5">Your invite link expires in 7 days</p>
    </CustomModal>
  );
};
