"use client";

import { Modal } from "@/components/Modal";
import { SettingsContext } from "@/components/settings/SettingsProvider";
import { useContext, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";

const ALL_USERS_INITIAL_POPUP_FLOW_COMPLETED =
  "allUsersInitialPopupFlowCompleted";

export function ChatPopup() {
  const [completedFlow, setCompletedFlow] = useState(true);

  useEffect(() => {
    setCompletedFlow(
      localStorage.getItem(ALL_USERS_INITIAL_POPUP_FLOW_COMPLETED) === "true"
    );
  });

  const settings = useContext(SettingsContext);
  if (!settings?.workspaces?.custom_header_content || completedFlow) {
    return null;
  }

  let popupTitle = settings.workspaces.custom_header_logo;
  if (!popupTitle) {
    popupTitle = `Welcome to ${
      settings.workspaces.workspace_name || "enMedD AI"
    }!`;
  }

  return (
    <Modal width="w-3/6 xl:w-[700px]" title={popupTitle}>
      <>
        <ReactMarkdown
          className="prose max-w-full"
          components={{
            a: ({ node, ...props }) => (
              <a
                {...props}
                className="text-link hover:text-link-hover"
                target="_blank"
                rel="noopener noreferrer"
              />
            ),
            p: ({ node, ...props }) => <p {...props} className="text-sm" />,
          }}
          remarkPlugins={[remarkGfm]}
        >
          {settings.workspaces.custom_header_content}
        </ReactMarkdown>

        <div className="flex w-full">
          <Button
            className="mx-auto mt-6"
            onClick={() => {
              localStorage.setItem(
                ALL_USERS_INITIAL_POPUP_FLOW_COMPLETED,
                "true"
              );
              setCompletedFlow(true);
            }}
          >
            Get started!
          </Button>
        </div>
      </>
    </Modal>
  );
}
