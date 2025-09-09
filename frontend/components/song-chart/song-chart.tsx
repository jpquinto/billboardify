"use client";

import { SongChart as SongChartType } from "@/types/chart-data";
import { SongChartEntry } from "./song-chart-entry";
import { FirstPlaceChartEntry } from "./first-place-chart-entry";
import { LiquidGlassContainer } from "@/components/ui/liquid-glass-container";
import Image from "next/image";
import { SecondPlaceChartEntry } from "./second-place-chart-entry";

export const SongChart = (chart: SongChartType) => {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex justify-center flex-col mx-auto px-4 pt-30">
      {/* Chart Header */}
      <div className="max-w-8xl mx-auto min-w-6xl mb-8">
        <h1 className="text-9xl font-bold bg-gradient-to-b from-black/40 to-black bg-clip-text text-transparent drop-shadow-2xl mb-2 tracking-tighter pb-5">
          My Hot 100
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 tracking-tighter">
          <p className="text-lg text-gray-900">
            Chart dated {formatDate(chart.timestamp)}
          </p>
          <p className="text-sm text-gray-500">
            {chart.totalEntries} total entries
          </p>
        </div>
      </div>

      <div className="relative max-w-8xl">
        <div className="fixed bottom-0 left-0 w-full h-full flex items-end justify-center bg-cover bg-center bg-no-repeat rounded-2xl shadow-lg">
          <div className="relative">
            <Image
              src="/banner.webp"
              alt="Artist Banner"
              width={1920}
              height={400}
              className="max-w-[100rem] max-h-[40rem] object-cover opacity-80 -z-10 rounded-2xl aspect-video"
              style={{ filter: "blur(1px)" }}
            />
            <div
              className="absolute inset-0 z-10 scale-[1.02] rounded-2xl"
              style={{
                background:
                  "radial-gradient(circle, transparent 30%, rgba(255,255,255,1) 100%)",
              }}
            ></div>
          </div>
        </div>
        <FirstPlaceChartEntry {...chart.chart[0]} />
        <SecondPlaceChartEntry {...chart.chart[1]} />
        <SecondPlaceChartEntry {...chart.chart[2]} />
      </div>

      {/* Chart Container */}
      <div className="w-full flex justify-center bg-gradient-to-b from-transparent to-5% to-white z-20">
        <div className="max-w-8xl mb-8 mx-auto min-w-6xl mt-5 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden z-20">
          {/* Chart Column Headers - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <div className="min-w-[60px]">Pos</div>
            <div className="w-12"></div> {/* Album cover space */}
            <div className="flex-1">Track</div>
            <div className="flex items-center gap-6">
              <div className="text-center min-w-[40px]">Last</div>
              <div className="text-center min-w-[40px]">Peak</div>
              <div className="text-center min-w-[40px]">Wks</div>
              <div className="text-center min-w-[60px]">Plays</div>
            </div>
          </div>

          {/* Chart Entries */}
          <div className="divide-y divide-gray-200">
            {chart.chart.slice(3).map((entry) => (
              <SongChartEntry key={entry.track_id} {...entry} />
            ))}
          </div>
        </div>
      </div>

      {/* Chart Footer */}
      <div className="max-w-6xl mt-8 text-center">
        <p className="text-sm text-gray-500">
          Chart rankings based on plays, points, and other factors
        </p>
      </div>
    </div>
  );
};
