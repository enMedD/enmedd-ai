import InstanceBranding from "./InstanceBranding";
import { SMTP } from "./SMTP";

export default function Page() {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container">
        <div className="pb-10">
          <h1 className="font-bold text-xl md:text-[28px] text-strong">
            White-label Branding & Settings
          </h1>
          <p className="text-subtle pt-2">
            Customize the branding of your instance and manage SMTP settings.
            Keep track of resource usage for better transparency and planning.
          </p>
        </div>

        <InstanceBranding />

        <SMTP />
      </div>
    </div>
  );
}
