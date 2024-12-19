import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Props {
  title: string;
  description: string;
  disabled?: boolean;
  onClick?: () => void;
}

export default function TemplateCard(props: Props) {
  const { description, disabled, title, onClick } = props;

  return (
    <Card
      className={`overflow-hidden bg-gray-50 w-80 !rounded-xl  justify-start items-start ${
        !disabled
          ? "cursor-pointer hover:shadow-lg hover: transition-shadow duration-300 ease-in-out"
          : "bg-gray-100 text-gray-400"
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <CardContent className="relative flex flex-col justify-between min-h-24 bg-muted/50">
        <div className="pb-6">
          <h2 className="w-full font-bold truncate flex">
            <span className="inline truncate">{title}</span>
          </h2>
          <span className="text-sm">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}
