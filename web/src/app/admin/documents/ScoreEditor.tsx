import { useToast } from "@/hooks/use-toast";
import { updateBoost } from "./lib";
import { EditableValue } from "@/components/EditableValue";
import { SCORE_EDITOR_ERROR_MESSAGES } from "@/constants/error";
import { SCORE_EDITOR_SUCCESS_MESSAGES } from "@/constants/success";

export const ScoreSection = ({
  documentId,
  initialScore,
  refresh,
  consistentWidth = true,
}: {
  documentId: string;
  initialScore: number;
  refresh: () => void;
  consistentWidth?: boolean;
}) => {
  const { toast } = useToast();

  const onSubmit = async (value: string) => {
    const numericScore = Number(value);
    if (isNaN(numericScore)) {
      toast({
        title: SCORE_EDITOR_ERROR_MESSAGES.INVALID_INPUT.title,
        description: SCORE_EDITOR_ERROR_MESSAGES.INVALID_INPUT.description,
        variant: "destructive",
      });
      return false;
    }

    const errorMsg = await updateBoost(documentId, numericScore);
    if (errorMsg) {
      toast({
        title: SCORE_EDITOR_ERROR_MESSAGES.UPDATE.title,
        description: SCORE_EDITOR_ERROR_MESSAGES.UPDATE.description(errorMsg),
        variant: "destructive",
      });
      return false;
    } else {
      toast({
        title: SCORE_EDITOR_SUCCESS_MESSAGES.UPDATE.title,
        description: SCORE_EDITOR_SUCCESS_MESSAGES.UPDATE.description,
        variant: "success",
      });
      refresh();
    }

    return true;
  };

  return (
    <EditableValue
      initialValue={initialScore.toString()}
      onSubmit={onSubmit}
      consistentWidth={consistentWidth}
    />
  );
};
