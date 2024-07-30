import { AdminPageTitle } from "@/components/admin/Title";
import { FiImage } from "react-icons/fi";
import { WhitelabelingForm } from "./WhitelabelingForm";

export default async function Whitelabeling() {
  return (
    <div className="mx-auto container">
      <AdminPageTitle
        title="Whitelabeling"
        icon={<FiImage size={32} className="my-auto" />}
      />

      <WhitelabelingForm />
    </div>
  );
}
