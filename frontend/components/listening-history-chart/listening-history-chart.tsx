import React, { useEffect, useState } from "react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { getListeningHistory } from "@/actions/get-listening-history";
import { ListeningHistoryChartData } from "@/types/listening-history";
import { LiquidGlassContainer } from "../ui/liquid-glass-container";

interface ListeningHistoryChartProps {
  id: string;
  type: "song" | "artist" | "album";
}

const chartConfig = {
  plays: {
    label: "Plays",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export const ListeningHistoryChart = ({
  id,
  type,
}: ListeningHistoryChartProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listeningHistoryData, setListeningHistoryData] = useState<Record<
    string,
    number
  > | null>(null);

  // Calculate date range (30 days ago to today)
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    return {
      start_date: start.toISOString().split("T")[0],
      end_date: end.toISOString().split("T")[0],
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { start_date, end_date } = getDateRange();
        const listeningHistory = await getListeningHistory({
          id,
          type,
          start_date,
          end_date,
        });

        setListeningHistoryData(listeningHistory);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load listening data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, type]);

  // Transform data for recharts
  const chartData = React.useMemo(() => {
    if (!listeningHistoryData) return [];

    const sortedEntries = Object.entries(listeningHistoryData).sort(
      ([a], [b]) => a.localeCompare(b)
    );

    // Find the first index with non-zero plays
    const firstNonZeroIndex = sortedEntries.findIndex(([, plays]) => plays > 0);

    // If no non-zero plays found, return empty array
    if (firstNonZeroIndex === -1) return [];

    // Return data starting from the first non-zero date
    return sortedEntries.slice(firstNonZeroIndex).map(([date, plays]) => ({
      date,
      plays,
      formattedDate: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [listeningHistoryData]);

  // Calculate total plays
  const totalPlays = React.useMemo(() => {
    if (!listeningHistoryData) return 0;
    return Object.values(listeningHistoryData).reduce(
      (sum, count) => sum + count,
      0
    );
  }, [listeningHistoryData]);

  if (loading) {
    return (
      <div className="flex flex-col space-y-3 p-6">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
        <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-200 rounded-lg bg-red-50">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error loading data</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!listeningHistoryData || Object.keys(listeningHistoryData).length === 0) {
    return (
      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">No listening data available</p>
        </div>
      </div>
    );
  }

  return (
    <LiquidGlassContainer className="p-6 border border-none rounded-lg flex flex-col">
      <div className="space-y-2 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 capitalize">
          {type} Listening History
        </h3>
        <p className="text-sm text-gray-600">
          Last 30 days • Total plays: {totalPlays.toLocaleString()}
        </p>
      </div>

      <ChartContainer config={chartConfig} className="w-full">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{
            top: 10,
            right: 10,
            left: 10,
            bottom: 10,
          }}
        >
          <defs>
            <linearGradient
              id="blueToPurpleGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#8200db" />
              {/* <stop offset="50%" stopColor="#fb64b6" />
              <stop offset="50%" stopColor="#ffba00" /> */}
              <stop offset="100%" stopColor="#fb64b6" />
            </linearGradient>
          </defs>
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="formattedDate"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => [`${value}`, " Plays"]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return new Date(data.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });
                  }
                  return label;
                }}
              />
            }
          />
          <Bar
            dataKey="plays"
            fill="url(#blueToPurpleGradient)"
            radius={[2, 8, 8, 2]}
            barSize={40}
          >
            <LabelList
              position="right"
              offset={12}
              className="fill-foreground"
              fontSize={12}
              formatter={(value: number) => (value > 0 ? value : "")}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </LiquidGlassContainer>
  );
};
