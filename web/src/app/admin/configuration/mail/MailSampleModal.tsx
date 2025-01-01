import { CustomModal } from "@/components/CustomModal";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      return toast({
        title: "Sample Mail Error",
        description: "Make sure to add values on email, subject, and body",
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
        title: "Sample Mail",
        description: "Sample mail successfully sent!",
        variant: "success",
      });
    } else {
      toast({
        title: "Sample Mail Error",
        description: `An error occured in sending sample mail (status-code=${response.status})`,
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
        placeholder="Sample email ex.: sample@vanguardai.io"
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
