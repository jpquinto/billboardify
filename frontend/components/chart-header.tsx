import Image from "next/image";

interface ChartHeaderProps {
  title: string;
  logo: string;
  timestamp: string;
  totalEntries: number;
}

export const ChartHeader = ({
  title,
  logo,
  timestamp,
  totalEntries,
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
    <div className="mx-auto min-w-6xl mb-8">
      <div className="flex gap-4">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 tracking-tighter">
        <p className="text-lg text-gray-900">
          Chart dated {formatDate(timestamp)}
        </p>
        <p className="text-sm text-gray-500">{totalEntries} total entries</p>
      </div>
    </div>
  );
};
