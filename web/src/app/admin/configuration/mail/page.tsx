"use client";

import { AdminPageTitle } from "@/components/admin/Title";
import { EnvelopeIcon } from "@/components/icons/icons";

import TemplateCard from "./TemplateCard";
import MailTemplateModal from "./MailTemplateModal";
import { getEmailTemplates } from "../../../../lib/email_templates";

import { useEffect, useState } from "react";
import { EmailTemplates } from "@/lib/types";

function Main() {
  const [openMailTemplateModal, setOpenMailTemplateModal] = useState(false);
  const [templateList, setTempplateList] = useState<EmailTemplates[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplates>();

  useEffect(() => {
    (async () => {
      const response = await getEmailTemplates();
      setTempplateList(response);
    })();
  }, []);

  return (
    <>
      <MailTemplateModal
        open={openMailTemplateModal}
        templateData={selectedTemplate}
        setOpen={setOpenMailTemplateModal}
      />
      <h4 className="pb-2 mb-4 text-xl font-bold text-text-800 text-text">
        Customize Your Invitation Email
      </h4>
      <p className="text-text-600">
        In this section, you can easily edit the email template used to invite
        users. Personalize the subject, content, and design to match your style.
        Tailor your message to make a great first impression and ensure your
        invitations are clear and engaging.
      </p>
      <br />
      <div className="relative w-full flex gap-2 flex-wrap">
        {templateList.map((template) => (
          <TemplateCard
            title={template.title}
            description={template.description}
            onClick={() => {
              setSelectedTemplate(template);
              setOpenMailTemplateModal(true);
            }}
          />
        ))}

        <TemplateCard
          disabled
          title="User Verification Mail Template"
          description="Mail template sent when a two-factor authentication is triggered during sign-in"
        />
        <TemplateCard
          disabled
          title="Password Reset Mail Template"
          description="Mail template sent when forgot password is used"
        />
      </div>
    </>
  );
}

export default function Page() {
  return (
    <>
      <div className="w-full h-full overflow-y-auto">
        <div className="container mx-auto">
          <AdminPageTitle
            title="Mail Template Configuration"
            icon={<EnvelopeIcon />}
          />
          <Main />
        </div>
      </div>
    </>
  );
}
