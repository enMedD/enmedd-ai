"use client";

import { CustomModal } from "@/components/CustomModal";
import { useEffect, useState } from "react";
import { ContentState, EditorState, convertToRaw } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import htmlToDraft from "html-to-draftjs";
import draftToHtml from "draftjs-to-html";
import MailSampleModal from "./MailSampleModal";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { EmailTemplates } from "@/lib/types";
import ModToolbarPlaceholder from "./ToolbarPlaceholder";
import { updateEmailTemplate } from "@/lib/email_templates";
import { toast } from "@/hooks/use-toast";
import { DeleteModal } from "@/components/DeleteModal";

interface MailTemplateModalProps {
  open: boolean;
  setOpen?: (state: boolean) => void;
  onUpdate?: () => void;
  onClose?: () => void;
}
interface Props extends MailTemplateModalProps {
  templateData?: EmailTemplates;
}

function MailConfirmModal(props: MailTemplateModalProps) {
  const { open, onClose, onUpdate, setOpen } = props;

  const closeCallback = () => {
    onClose && onClose();
    setOpen && setOpen(false);
  };

  return (
    <DeleteModal
      open={open}
      onSuccess={() => onUpdate && onUpdate()}
      onClose={closeCallback}
      description="Are you sure you want to overwrite the current email template?"
      title="Update Confirmation"
    />
  );
}

export default function MailTemplateModal(props: Props) {
  const { open, templateData, onClose, onUpdate, setOpen } = props;

  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openDemo, setOpenDemo] = useState(false);
  const [subject, setSubject] = useState("");
  const [htmlData, setHtmlData] = useState("<p></p>");

  // re-renders html data to ensure that there will be no bugs
  useEffect(() => {
    if (htmlData !== parseInputToHtml()) {
      const { contentBlocks, entityMap } = htmlToDraft(htmlData);
      const contentState = ContentState.createFromBlockArray(
        contentBlocks,
        entityMap
      );
      setEditorState(EditorState.createWithContent(contentState));
    }
  }, [htmlData]);

  // loads the template data when changed
  useEffect(() => {
    if (templateData) {
      setSubject(templateData.subject);
      setHtmlData(templateData.body);
    }
  }, [templateData]);

  // retrieve the parsed html from Editor's draftjs format
  const parseInputToHtml = () => {
    const rawCurrentContent = convertToRaw(editorState.getCurrentContent());
    const parsedToHtml = draftToHtml(rawCurrentContent);
    return parsedToHtml;
  };

  // updates the selected mail template
  const updateMailCallback = async () => {
    if (templateData) {
      if (subject === "" || htmlData === "") {
        toast({
          title: "Email Template Value Error",
          description: "Email subject and body must contain any value",
          variant: "destructive",
        });
        return;
      }

      const response = await updateEmailTemplate(templateData.id, {
        subject,
        body: htmlData,

        // soon to be editted
        description: templateData.description,
        title: templateData.title,
        workspace_id: templateData.workspace_id,
      });

      if (response.status == 200) {
        onUpdate && onUpdate();
        toast({
          title: "Email Template Update",
          description: "Successfuly updated email template!",
          variant: "success",
        });
      } else {
        toast({
          title: "Email Template Update",
          description: `Error occured in updating email (status-code=${response.status})`,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <>
      <MailSampleModal
        open={openDemo}
        setOpen={setOpenDemo}
        body={htmlData}
        subject={subject}
      />
      <MailConfirmModal
        open={openConfirm}
        setOpen={setOpenConfirm}
        onUpdate={updateMailCallback}
      />
      <CustomModal
        title="Update Mail Template"
        trigger
        open={open}
        onClose={() => {
          onClose && onClose();
          setOpen && setOpen(false);
        }}
      >
        <p className="mb-2 font-bold">Mail Subject</p>
        <Input
          placeholder="Subject"
          className="bg-gray-100 outline-none border-gray-200 rounded-none"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        />
        <br />

        <p className="mb-2 font-bold">Mail Body</p>
        <Editor
          placeholder="Email Body"
          editorState={editorState}
          editorClassName="p-2 bg-gray-100"
          editorStyle={{
            height: "20vh",
          }}
          onEditorStateChange={setEditorState}
          onChange={() => {
            const parsedData = parseInputToHtml();
            setHtmlData(parsedData);
          }}
          toolbarCustomButtons={[
            <ModToolbarPlaceholder
              key={"mod_toolbar"}
              dropdownType={templateData?.type}
              editorState={editorState}
            />,
          ]}
        />
        <div className="pt-3 px-2 text-right">
          <Button
            variant="default"
            className="py-2 mr-1 px-4"
            onClick={() => setOpenDemo(true)}
          >
            Send a sample
          </Button>
          <Button
            variant="default"
            className="py-2 px-4"
            onClick={() => setOpenConfirm(true)}
          >
            Update
          </Button>
        </div>
      </CustomModal>
    </>
  );
}
