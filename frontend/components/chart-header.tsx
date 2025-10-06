import Image from "next/image";

interface ChartHeaderProps {
  title: string;
  logo: string;
  timestamp: string;
  color1: string;
  color2: string;
  color3: string;
  decorationOpacity?: string;
}

export const ChartHeader = ({
  title,
  logo,
  timestamp,
  color1,
  color2,
  color3,
  decorationOpacity,
}: ChartHeaderProps) => {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  return (
    <>
      <div className="mx-auto min-w-6xl">
        <div className="flex gap-4 justify-center">
          <Image
            src={logo}
            alt="Logo"
            className="h-full w-auto"
            width={260}
            height={260}
          />
          <h1 className="text-9xl font-bold bg-gradient-to-b from-black/10 to-black bg-clip-text text-transparent drop-shadow-2xl mb-2 tracking-tighter pb-5">
            {title}
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 tracking-tighter pb-10">
          <p className="text-lg text-gray-900">
            Chart dated {formatDate(timestamp)}
          </p>
        </div>
      </div>
      <ChartHeaderDecoration
        color1={color1}
        color2={color2}
        color3={color3}
        decorationOpacity={decorationOpacity}
      />
    </>
  );
};

interface ChartHeaderDecorationProps {
  color1: string;
  color2: string;
  color3: string;
  decorationOpacity?: string;
}

const ChartHeaderDecoration = ({
  color1 = "bg-amber-400",
  color2 = "bg-pink-400",
  color3 = "bg-purple-700",
  decorationOpacity = "opacity-10",
}: ChartHeaderDecorationProps) => {
  return (
    <div className={`relative min-w-2xl mx-auto ${decorationOpacity} z-20`}>
      <div className="absolute top-0 left-0 w-full h-6">
        <div
          className={`w-[60%] mx-auto pb-9 ${color1} rounded-b-full border-white border-[1px] shadow-2xl`}
        ></div>
      </div>
      <div className="absolute top-0 left-0 w-full h-6">
        <div
          className={`w-[80%] mx-auto pb-6 ${color2} rounded-b-full border-white border-[1px] shadow-2xl`}
        ></div>
      </div>
      <div className="absolute top-0 left-0 w-full h-6">
        <div
          className={`pb-3 ${color3} rounded-b-full border-white border-[1px] shadow-2xl`}
        ></div>
      </div>
    </div>
  );
};
