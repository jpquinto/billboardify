import { BarChart3 } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

// Helper function to check if data matches bar chart data structure
export const isBarChartData = (data: any[]): boolean => {
  if (!data || data.length === 0) return false;

  const firstItem = data[0];

  // Check for date field
  const hasDate = "date" in firstItem;

  // Check for plays field (flexible - could be "total_plays", "plays", or "daily_play_count")
  const hasPlays =
    "total_plays" in firstItem ||
    "plays" in firstItem ||
    "daily_play_count" in firstItem;

  return hasDate && hasPlays;
};

interface BarChartDataItem {
  date: string;
  total_plays?: number;
  plays?: number;
  daily_play_count?: number;
}

interface ChatBarChartProps {
  data: BarChartDataItem[];
}

const chartConfig = {
  plays: {
    label: "Plays",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export const ChatBarChart = ({ data }: ChatBarChartProps) => {
  // Transform data for recharts
  const chartData = data
    .map((item) => {
      const plays =
        item.total_plays ?? item.plays ?? item.daily_play_count ?? 0;
      return {
        date: item.date,
        plays,
        formattedDate: new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  // Calculate total plays
  const totalPlays = chartData.reduce((sum, item) => sum + item.plays, 0);

  // Determine date range
  const dateRange =
    chartData.length > 0
      ? `${new Date(chartData[0].date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${new Date(
          chartData[chartData.length - 1].date
        ).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`
      : "";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Listening History
        </h3>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <div className="space-y-2 mb-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {dateRange} • Total plays: {totalPlays.toLocaleString()}
          </p>
        </div>

        <ChartContainer config={chartConfig} className="w-full h-64">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{
              top: 5,
              right: 25,
              left: 10,
              bottom: 5,
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
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "currentColor" }}
              tickLine={false}
              axisLine={false}
              className="text-slate-600 dark:text-slate-400"
            />
            <YAxis
              type="category"
              dataKey="formattedDate"
              tick={{ fontSize: 11, fill: "currentColor" }}
              tickLine={false}
              axisLine={false}
              width={50}
              className="text-slate-600 dark:text-slate-400"
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
              barSize={32}
            >
              <LabelList
                position="right"
                offset={8}
                fontSize={11}
                className="fill-slate-700 dark:fill-slate-300 pr-5"
                formatter={(value: number) => (value > 0 ? value : "")}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
};
