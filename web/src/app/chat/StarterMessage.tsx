import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { StarterMessage as StarterMessageType } from "../admin/assistants/interfaces";

export function StarterMessage({
  starterMessage,
  onClick,
}: {
  starterMessage: StarterMessageType;
  onClick: () => void;
}) {
  return (
    <Card
      className="h-[130px] p-4 justify-between flex flex-col cursor-pointer border shadow-none text-default"
      onClick={onClick}
    >
      <CardContent className="p-0 line-clamp">
        <p>{starterMessage.description}</p>
      </CardContent>{" "}
      <CardFooter className="p-0">
        {/* TODO: Create icon as a data for the starter messages */}
        {/* <ChevronsLeftRight size={24} className="ml-auto" /> */}
      </CardFooter>
    </Card>
  );
}
