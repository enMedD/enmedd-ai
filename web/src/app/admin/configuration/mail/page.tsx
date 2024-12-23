"use client";

import { AdminPageTitle } from "@/components/admin/Title";
import { EnvelopeIcon } from "@/components/icons/icons";

import TemplateCard from "./TemplateCard";
import MailTemplateModal from "./MailTemplateModal";
import { getEmailTemplates } from "../../../../lib/email_templates";

import { useEffect, useState } from "react";
import { EmailTemplates } from "@/lib/types";
import { Loading } from "@/components/Loading";
import { SearchInput } from "@/components/SearchInput";

function Main() {
  const [openMailTemplateModal, setOpenMailTemplateModal] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [templateList, setTempplateList] = useState<EmailTemplates[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplates>();
  const [retrieveLoading, setRetrieveLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    (async () => {
      setRetrieveLoading(true);
      const response = await getEmailTemplates();

      setTempplateList(response);
      setRetrieveLoading(false);
    })();
  }, [forceRefresh]);

  // debounce trigger when searching
  useEffect(() => {
    if (searchValue !== "") {
      const timer = setTimeout(() => {
        (async () => {
          setRetrieveLoading(true);
          const response = await getEmailTemplates();
          setTempplateList(
            response.filter((mailTmp) =>
              mailTmp.title.toLowerCase().includes(searchValue.toLowerCase())
            )
          );
          setRetrieveLoading(false);
        })();
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setForceRefresh(forceRefresh + 1);
    }
  }, [searchValue]);

  const onMailTemplateUpdate = () => {
    setSelectedTemplate(undefined);
    setForceRefresh(forceRefresh + 1);
  };

  return (
    <>
      {selectedTemplate && (
        <MailTemplateModal
          open={openMailTemplateModal}
          templateData={selectedTemplate}
          setOpen={setOpenMailTemplateModal}
          onUpdate={onMailTemplateUpdate}
          onClose={() => setSelectedTemplate(undefined)}
        />
      )}
      <h4 className="pb-2 mb-4 text-xl font-bold text-text-800 text-text">
        Customize Your Email Templates
      </h4>
      <p className="text-text-600">
        In this section, you can easily edit the email template used to invite
        users. Personalize the subject, content, and design to match your style.
        Tailor your message to make a great first impression and ensure your
        invitations are clear and engaging.
      </p>
      <br />
      <SearchInput
        placeholder="Search Email Template"
        value={searchValue}
        onChange={(value) => {
          setSearchValue(value);
        }}
      />
      <br />
      <div className="relative w-full flex gap-2 flex-wrap">
        {retrieveLoading && (
          <div className="flex justify-center items-center gap-1">
            <Loading />
            <>{" Retrieving Templates..."}</>
          </div>
        )}
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
