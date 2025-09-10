import { Separator } from "@/components/ui/separator";
import Image from "next/image";

export const LogoSeparator = ({ logo }: { logo: string }) => {
  return (
    <div className="flex justify-center items-center">
      <Separator className="w-1/4 lg:w-1/3 px-10 h-2 bg-gradient-to-bl from-purple-700 via-pink-400 to-amber-400" />
      <Image
        src={logo}
        alt="Chart Logo"
        width={150}
        height={50}
        className="mx-4 my-2 object-cover h-20 w-20"
      />
      <Separator className="w-1/4 lg:w-1/3 px-10 h-2 bg-gradient-to-br from-purple-700 via-pink-400 to-amber-400" />
    </div>
  );
};
