import { AdminPageTitle } from "@/components/admin/Title";
import { FiImage } from "react-icons/fi";
import { WhitelabelingForm } from "./WhitelabelingForm";

export default async function Whitelabeling() {
  return (
    <div className="py-24 md:py-32 lg:pt-16">
      <AdminPageTitle
        title="Whitelabeling"
        icon={<FiImage size={32} className="my-auto" />}
      />

      <WhitelabelingForm />
    </div>
  );
}
