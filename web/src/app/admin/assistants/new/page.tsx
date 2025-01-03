import { AssistantEditor } from "../AssistantEditor";
import { ErrorCallout } from "@/components/ErrorCallout";
import { RobotIcon } from "@/components/icons/icons";
import { BackButton } from "@/components/BackButton";
import { AdminPageTitle } from "@/components/admin/Title";
import { fetchAssistantEditorInfoSS } from "@/lib/assistants/fetchAssistantEditorInfoSS";
import { SuccessfulAssistantUpdateRedirectType } from "../enums";
import { Card, CardContent } from "@/components/ui/card";

export default async function Page() {
  const [values, error] = await fetchAssistantEditorInfoSS();

  let body;
  if (!values) {
    body = (
      <ErrorCallout errorTitle="Something went wrong :(" errorMsg={error} />
    );
  } else {
    body = (
      <Card>
        <CardContent>
          <AssistantEditor
            {...values}
            defaultPublic={true}
            redirectType={SuccessfulAssistantUpdateRedirectType.ADMIN}
            shouldAddAssistantToUserPreferences={true}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container">
        <BackButton />

        <AdminPageTitle
          title="Create a New Assistant"
          icon={<RobotIcon size={32} />}
        />

        {body}
      </div>
    </div>
  );
}
