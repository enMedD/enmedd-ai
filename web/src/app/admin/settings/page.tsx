import { AdminPageTitle } from "@/components/admin/Title";
import { Text } from "@tremor/react";
import { FiSettings } from "react-icons/fi";
import { SettingsForm } from "./SettingsForm";

export default async function Page() {
  return (
    <div className="mx-auto container">
      <AdminPageTitle
        title="Workspace Settings"
        icon={<FiSettings size={32} className="my-auto" />}
      />

      <Text className="mb-8">
        Manage general VanguardAI settings applicable to all users in the
        workspace.
      </Text>

      <SettingsForm />
    </div>
  );
}
