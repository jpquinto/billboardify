import React, { useEffect, useState } from "react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { LiquidGlassContainer } from "../ui/liquid-glass-container";
import { LeaderboardSummary as LeaderboardSummaryType } from "@/types/leaderboard";

interface LeaderboardSummaryProps {
  summary: LeaderboardSummaryType;
}

const chartConfig = {
  plays: {
    label: "Plays",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export const LeaderboardSummary = ({ summary }: LeaderboardSummaryProps) => {
  const chartData = Object.entries(summary.total_streams_by_granularity || {})
    .map(([date, plays]) => ({
      date,
      plays,
      formattedDate: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <LiquidGlassContainer className="p-6 border border-none rounded-lg flex flex-col">
      <div className="space-y-2 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 capitalize">
          Listening History
        </h3>
        <p className="text-sm text-gray-600">
          Last 30 days • Unique Entries: {summary.unique_entries}
        </p>
      </div>

      <ChartContainer config={chartConfig} className="w-full min-h-[30rem]">
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
              <stop offset="0%" stopColor={"#8200db"} stopOpacity="0.7" />
              <stop offset="100%" stopColor={"#fb64b6"} stopOpacity="0.7" />
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
            barSize={60}
          ></Bar>
        </BarChart>
      </ChartContainer>
    </LiquidGlassContainer>
  );
};
