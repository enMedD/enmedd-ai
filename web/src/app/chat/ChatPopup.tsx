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
  const [showConsentError, setShowConsentError] = useState(false);

  useEffect(() => {
    setCompletedFlow(
      localStorage.getItem(ALL_USERS_INITIAL_POPUP_FLOW_COMPLETED) === "true"
    );
  }, []);

  const settings = useContext(SettingsContext);
  const workspaceSettings = settings?.workspaces;
  const isConsentScreen = workspaceSettings?.enable_consent_screen;
  if (
    (!workspaceSettings?.custom_popup_content && !isConsentScreen) ||
    completedFlow
  ) {
    return null;
  }

  let popupTitle = workspaceSettings?.custom_header_logo;
  if (!popupTitle) {
    popupTitle = `Welcome to ${
      workspaceSettings?.workspace_name || "enMedD AI"
    }!`;
  }
  const popupContent =
    workspaceSettings?.custom_popup_content ||
    (isConsentScreen
      ? "By clicking 'I Agree', you acknowledge that you agree to the terms of use of this application and consent to proceed."
      : "");

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
          {popupContent}
        </ReactMarkdown>

        {showConsentError && (
          <p className="text-red-500 text-sm mt-2">
            You need to agree to the terms to access the application.
          </p>
        )}

        <div className="flex w-full justify-center gap-4 mt-4">
          {isConsentScreen && (
            <Button
              size="xs"
              color="red"
              onClick={() => setShowConsentError(true)}
            >
              Cancel
            </Button>
          )}
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
            {isConsentScreen ? "I Agree" : "Get started!"}
          </Button>
        </div>
      </>
    </Modal>
  );
}
