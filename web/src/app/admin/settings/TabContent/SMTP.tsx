import { TextFormField } from "@/components/admin/connectors/Field";
import { SettingsContext } from "@/components/settings/SettingsProvider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useContext, useState } from "react";

export function SMTP() {
  const settings = useContext(SettingsContext);
  if (!settings) {
    return null;
  }
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    smtp_server: settings.settings.smtp_server,
    smtp_port: settings.settings.smtp_port,
    smtp_username: settings.settings.smtp_username,
    smtp_password: settings.settings.smtp_password,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  async function updateSmtpSettings(workspaceId: number, smtpSettings: any) {
    setLoading(true);
    const response = await fetch(
      `/api/admin/settings/workspace/${workspaceId}/smtp`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(smtpSettings),
      }
    );

    setLoading(false);
    if (response.ok) {
      toast({
        title: "SMTP Settings Updated",
        description: "The SMTP settings have been successfully updated.",
        variant: "success",
      });
    } else {
      const errorMsg = (await response.json()).detail;
      toast({
        title: "Failed to update SMTP settings.",
        description: errorMsg,
        variant: "destructive",
      });
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "smtp_port" ? parseInt(value, 10) : value,
    }));
  };

  return (
    <div className="py-8 mt-20 border-t">
      <div className="flex gap-5 flex-col md:flex-row">
        <div className="leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
          <Label
            htmlFor="workspace_description"
            className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
          >
            SMTP
          </Label>
          <p className="text-sm text-muted-foreground pb-1.5 md:w-4/5">
            Enables the exchange of emails between servers.
          </p>
        </div>

        <div className="md:w-[500px]">
          <div className="flex flex-col items-end">
            <div
              className={`w-full flex flex-col ${!isEditing ? "gap-4" : ""}`}
            >
              {isEditing ? (
                <>
                  <TextFormField
                    name="smtp_server"
                    label="SMTP Server"
                    placeholder="Enter hostname"
                    value={formData?.smtp_server || ""}
                    onChange={handleChange}
                  />

                  <TextFormField
                    name="smtp_port"
                    label="SMTP Port"
                    placeholder="Enter port"
                    type="text"
                    value={formData.smtp_port?.toString() || ""}
                    onChange={handleChange}
                  />

                  <TextFormField
                    name="smtp_username"
                    label="SMTP Username (email)"
                    placeholder="Enter username"
                    value={formData?.smtp_username || ""}
                    onChange={handleChange}
                  />

                  <TextFormField
                    name="smtp_password"
                    label="SMTP Password"
                    placeholder="Enter password"
                    type="password"
                    value={formData?.smtp_password || ""}
                    onChange={handleChange}
                  />
                </>
              ) : (
                <>
                  <div className="flex gap-6">
                    <span className="whitespace-nowrap">SMTP Server:</span>
                    <span className="font-semibold text-inverted-inverted w-full truncate">
                      {loading
                        ? "Syncing"
                        : settings.settings.smtp_server || "None"}
                    </span>
                  </div>

                  <div className="flex gap-6">
                    <span className="whitespace-nowrap">SMTP Port:</span>
                    <span className="font-semibold text-inverted-inverted w-full truncate">
                      {loading
                        ? "Syncing"
                        : settings.settings.smtp_port || "None"}
                    </span>
                  </div>

                  <div className="flex gap-6">
                    <span className="whitespace-nowrap">
                      SMTP Username (email):
                    </span>
                    <span className="font-semibold text-inverted-inverted w-full truncate">
                      {loading
                        ? "Syncing"
                        : settings.settings.smtp_username || "None"}
                    </span>
                  </div>

                  <div className="flex gap-6">
                    <span className="whitespace-nowrap">SMTP Password:</span>
                    <span className="font-semibold text-inverted-inverted truncate">
                      {loading
                        ? "Syncing"
                        : settings.settings.smtp_password
                          ? "●●●●●●●●"
                          : "None"}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-end">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setIsEditing(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={async () => {
                        setIsEditing(false);
                        await updateSmtpSettings(0, formData);
                      }}
                      disabled={
                        loading ||
                        JSON.stringify(formData) ===
                          JSON.stringify({
                            smtp_server: settings.settings.smtp_server,
                            smtp_port: settings.settings.smtp_port,
                            smtp_username: settings.settings.smtp_username,
                            smtp_password: settings.settings.smtp_password,
                          })
                      }
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    type="button"
                    variant="outline"
                    disabled={loading}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
