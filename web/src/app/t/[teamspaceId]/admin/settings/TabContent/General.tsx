import { Input } from "@/components/ui/input";
import Image from "next/image";
import Logo from "../../../../../../../public/logo.png";

export default function General() {
  return (
    <div className="mt-8 w-full">
      <div>
        <h2 className="font-bold text:lg md:text-xl">General Information</h2>
        <p className="text-sm">
          Lorem ipsum, dolor sit amet consectetur adipisicing elit.
        </p>
      </div>

      <div className="w-full">
        <div className="flex py-8 border-b">
          <div className="w-44 sm:w-96 lg:w-[500px] shrink-0">
            <span className="font-semibold text-inverted-inverted">
              Teamspace Name
            </span>
            <p className="pt-1 text-sm">
              This will be displayed on your profile.
            </p>
          </div>
          <div className="w-44 sm:w-96 lg:w-[500px] shrink-0">
            <Input />
          </div>
        </div>

        <div className="flex py-8 border-b">
          <div className="w-44 sm:w-96 lg:w-[500px] shrink-0">
            <span className="font-semibold text-inverted-inverted">
              Teamspace Logo
            </span>
            <p className="pt-1 text-sm max-w-[80%]">
              Update your company logo and select where you want it to be
              displayed.
            </p>
          </div>
          <div className="w-44 sm:w-96 lg:w-[500px] shrink-0">
            <Image src={Logo} alt="Logo" />
          </div>
        </div>
      </div>
    </div>
  );
}
