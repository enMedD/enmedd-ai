"use client";

import { useToast } from "@/hooks/use-toast";
import { User } from "@/lib/types";
import { Button } from "./ui/button";
import useSWRMutation from "swr/mutation";
import userMutationFetcher from "@/lib/admin/users/userMutationFetcher";

export const DeactivaterButton = ({
  user,
  deactivate,
  mutate,
}: {
  user: User;
  deactivate: boolean;
  mutate: () => void;
}) => {
  const { toast } = useToast();
  const { trigger, isMutating } = useSWRMutation(
    deactivate
      ? "/api/manage/admin/deactivate-user"
      : "/api/manage/admin/activate-user",
    userMutationFetcher,
    {
      onSuccess: () => {
        mutate();
        toast({
          title: "User Status Updated",
          description: `User has been successfully ${deactivate ? "deactivated" : "activated"}.`,
          variant: "success",
        });
      },
      onError: (errorMsg) =>
        toast({
          title: "Operation Failed",
          description: `Unable to ${deactivate ? "deactivate" : "activate"} user: ${errorMsg}`,
          variant: "destructive",
        }),
    }
  );
  return (
    <Button
      onClick={() => trigger({ user_email: user.email })}
      disabled={isMutating}
      variant={deactivate ? "destructive" : "default"}
    >
      {deactivate ? "Deactivate" : "Activate"}
    </Button>
  );
};
