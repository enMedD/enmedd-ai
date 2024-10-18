import { AdminPageTitle } from "@/components/admin/Title";
import { CUSTOM_ANALYTICS_ENABLED } from "@/lib/constants";
import { Callout, Text } from "@tremor/react";
import { CustomAnalyticsUpdateForm } from "./CustomAnalyticsUpdateForm";
import { BarChart2 } from "lucide-react";

function Main() {
  if (!CUSTOM_ANALYTICS_ENABLED) {
    return (
      <div>
        <div className="mt-4">
          <Callout title="Custom Analytics is not enabled." color="red">
            To set up custom analytics scripts, please work with the team who
            setup enMedD AI in your organization to set the{" "}
            <i>CUSTOM_ANALYTICS_SECRET_KEY</i> environment variable.
          </Callout>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Text className="mb-8">
        This allows you to bring your own analytics tool to enMedD AI! Copy the
        Web snippet from your analytics provider into the box below, and
        we&apos;ll start sending usage events.
      </Text>

      <CustomAnalyticsUpdateForm />
    </div>
  );
}

export default function Page() {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container">
        <AdminPageTitle
          title="Custom Analytics"
          icon={<BarChart2 size={32} />}
        />

        <div />
      </div>
    </div>
  );
}
