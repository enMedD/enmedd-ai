import { BackButton } from "@/components/BackButton";
import { ErrorCallout } from "@/components/ErrorCallout";
import { AdminPageTitle } from "@/components/admin/Title";
import { RobotIcon } from "@/components/icons/icons";
import { fetchAssistantEditorInfoSS } from "@/lib/assistants/fetchPersonaEditorInfoSS";
import { Card, Title } from "@tremor/react";
import { AssistantEditor } from "../AssistantEditor";
import { SuccessfulPersonaUpdateRedirectType } from "../enums";
import { DeletePersonaButton } from "./DeletePersonaButton";

export default async function Page({ params }: { params: { id: string } }) {
  const [values, error] = await fetchAssistantEditorInfoSS(params.id);

  let body;
  if (!values) {
    body = (
      <ErrorCallout errorTitle="Something went wrong :(" errorMsg={error} />
    );
  } else {
    body = (
      <>
        <Card>
          <AssistantEditor
            {...values}
            defaultPublic={true}
            redirectType={SuccessfulPersonaUpdateRedirectType.ADMIN}
          />
        </Card>

        <div className="mt-12">
          <Title>Delete Assistant</Title>
          <div className="flex mt-6">
            <DeletePersonaButton
              personaId={values.existingPersona!.id}
              redirectType={SuccessfulPersonaUpdateRedirectType.ADMIN}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <div>
      <BackButton />

      <AdminPageTitle title="Edit Assistant" icon={<RobotIcon size={32} />} />

      {body}
    </div>
  );
}
