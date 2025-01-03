import { CustomModal } from "@/components/CustomModal";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAIL_ERROR_MESSAGES } from "@/constants/toast/error";
import { MAIL_SUCCESS_MESSAGES } from "@/constants/toast/success";
import { useToast } from "@/hooks/use-toast";
import { sendSampleEmailTemplate } from "@/lib/email_templates";
import { useState } from "react";

interface Props {
  open?: boolean;
  subject: string;
  body: string;
  setOpen?: (state: boolean) => void;
}

export default function MailSampleModal(props: Props) {
  const { body, open, subject, setOpen } = props;
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendSampleMail = async () => {
    setIsLoading(true);
    if (body === "" || email === "" || subject === "") {
      toast({
        title: MAIL_ERROR_MESSAGES.INCOMPLETE_EMAIL.title,
        description: MAIL_ERROR_MESSAGES.INCOMPLETE_EMAIL.description,
        variant: "destructive",
      });
    }

    const response = await sendSampleEmailTemplate({
      body,
      email,
      subject,
    });

    if (response.status === 200) {
      setOpen && setOpen(false);
      toast({
        title: MAIL_SUCCESS_MESSAGES.SENT_SUCCESS.title,
        description: MAIL_SUCCESS_MESSAGES.SENT_SUCCESS.description,
        variant: "success",
      });
    } else {
      toast({
        title: MAIL_ERROR_MESSAGES.MAIL_ERROR.title,
        description: MAIL_ERROR_MESSAGES.MAIL_ERROR.description(
          response.status
        ),
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <CustomModal
      trigger
      title="Sample Mailing"
      open={open}
      onClose={() => setOpen && setOpen(false)}
      headerClassName="py-0"
    >
      Send a demo mail to the specified email to test the template&apos;s style.
      <br />
      <br />
      <Input
        type="email"
        placeholder="Sample email ex.: sample@arnoldai.io"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
        }}
      />
      <div className="text-right mt-2">
        <Button disabled={isLoading} variant="default" onClick={sendSampleMail}>
          {isLoading ? <Loading /> : "Send Sample"}
        </Button>
      </div>
    </CustomModal>
  );
}
