import Main from "@/app/admin/assistants/Main";

export default function Page({ params }: { params: { teamspaceId: string } }) {
  return <Main teamspaceId={params.teamspaceId} />;
}
