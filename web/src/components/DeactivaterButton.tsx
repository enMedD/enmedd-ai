"use client";

import { useToast } from "@/hooks/use-toast";
import { User } from "@/lib/types";
import { Button } from "./ui/button";
import useSWRMutation from "swr/mutation";
import userMutationFetcher from "@/lib/admin/users/userMutationFetcher";
import { USERS_SUCCESS_MESSAGES } from "@/constants/toast/success";
import { OPERATION_ERROR_MESSAGES } from "@/constants/toast/error";

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
          title: USERS_SUCCESS_MESSAGES.DEACTIVATE.title,
          description:
            USERS_SUCCESS_MESSAGES.DEACTIVATE.description(deactivate),
          variant: "success",
        });
      },
      onError: (errorMsg) =>
        toast({
          title: OPERATION_ERROR_MESSAGES.ACTION.title("Deactivate"),
          description: OPERATION_ERROR_MESSAGES.ACTION.description(
            "user",
            deactivate ? "deactivate" : "activate",
            errorMsg
          ),
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
