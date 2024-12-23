import WorkspaceCreationForm from "./WorkspaceCreationForm";

export default function Page() {
  return (
    <div className="container">
      <div className="mt-12 space-y-2">
        <h1 className="text-center font-bold text-5xl">
          Create a new workspace
        </h1>
        <p className="text-center text-xl font-semibold">
          Workspace organizes projects, tasks, and collaboration for
          productivity
        </p>
      </div>

      <WorkspaceCreationForm />
    </div>
  );
}
