import { BackButton } from "@/components/BackButton";
import { ErrorCallout } from "@/components/ErrorCallout";
import { AdminPageTitle } from "@/components/admin/Title";
import { RobotIcon } from "@/components/icons/icons";
import { fetchAssistantEditorInfoSS } from "@/lib/assistants/fetchPersonaEditorInfoSS";
import { Card } from "@tremor/react";
import { AssistantEditor } from "../AssistantEditor";
import { SuccessfulPersonaUpdateRedirectType } from "../enums";

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
        <AssistantEditor
          {...values}
          defaultPublic={true}
          redirectType={SuccessfulPersonaUpdateRedirectType.ADMIN}
        />
      </Card>
    );
  }

  return (
    <div>
      <BackButton />

      <AdminPageTitle
        title="Create a New Persona"
        icon={<RobotIcon size={32} />}
      />

      {body}
    </div>
  );
}
