import { ErrorCallout } from "@/components/ErrorCallout";
import { BackButton } from "@/components/BackButton";
import { fetchAssistantEditorInfoSS } from "@/lib/assistants/fetchAssistantEditorInfoSS";
import { RobotIcon } from "@/components/icons/icons";
import { AdminPageTitle } from "@/components/admin/Title";
import { Card, CardContent } from "@/components/ui/card";
import { AssistantEditor } from "@/app/admin/assistants/AssistantEditor";
import { SuccessfulAssistantUpdateRedirectType } from "@/app/admin/assistants/enums";
import { DeleteAssistantButton } from "@/app/admin/assistants/[id]/DeleteAssistantButton";

export default async function Main({
  id,
  teamspaceId,
}: {
  id: string;
  teamspaceId?: string | string[];
}) {
  const [values, error] = await fetchAssistantEditorInfoSS(id, teamspaceId);

  if (!values) {
    return (
      <ErrorCallout errorTitle="Something went wrong :(" errorMsg={error} />
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <AssistantEditor
            {...values}
            defaultPublic={true}
            redirectType={SuccessfulAssistantUpdateRedirectType.ADMIN}
            teamspaceId={teamspaceId}
          />
        </CardContent>
      </Card>

      <div className="mt-12">
        <DeleteAssistantButton
          assistantId={values.existingAssistant!.id}
          redirectType={SuccessfulAssistantUpdateRedirectType.ADMIN}
        />
      </div>
    </>
  );
}
