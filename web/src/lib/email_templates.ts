import { EmailTemplates } from "./types";

export interface UpdateEmailTemplateType extends Omit<EmailTemplates, "id"> {
  id?: number;
}

export interface SampleEmailType {
  subject: string;
  body: string;
  email: string;
}

export const getEmailTemplates = async (): Promise<EmailTemplates[]> => {
  const response = await fetch("/api/email-templates", { method: "GET" });
  if (!response.ok) {
    return [];
  }

  return await response.json();
};

export const updateEmailTemplate = async (
  id: number,
  payload: UpdateEmailTemplateType
): Promise<Response> => {
  const response = await fetch(`/api/email-templates/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response;
};

export const sendSampleEmailTemplate = async (
  payload: SampleEmailType
): Promise<Response> => {
  const response = await fetch("/api/email-templates/send-sample", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return await response;
};
