"use client";

import { SongChart as SongChartType } from "@/types/chart-data";
import Image from "next/image";
import { BannerScroller } from "../ui/banner-scroller";
import { ChartHeader } from "../chart-header";
import { FirstPlaceChartEntry } from "../song-chart/first-place-chart-entry";
import { SecondPlaceChartEntry } from "../song-chart/second-place-chart-entry";
import { TopTenChartEntry } from "../song-chart/top-ten-chart-entry";
import { SongChartEntry } from "../song-chart/song-chart-entry";

export const ArtistChart = ({
  chartData,
  timestamp,
}: {
  chartData: SongChartType;
  timestamp: string;
}) => {
  const { chartData: chartEntries, chartSummary, banners } = chartData;
  return (
    <div className="flex justify-center flex-col mx-auto px-4 pt-30">
      <ChartHeader
        title={"My Artist 25"}
        logo={"/artist-chart-logo.png"}
        timestamp={timestamp}
        totalEntries={chartEntries.length}
      />

      <div className="relative max-w-8xl">
        <BannerScroller banners={banners.map((banner) => banner.banner_url)} />
        <FirstPlaceChartEntry {...chartEntries[0]} />
        <SecondPlaceChartEntry {...chartEntries[1]} />
        <SecondPlaceChartEntry {...chartEntries[2]} />
        <div className="pt-5">
          {chartEntries.slice(3, 40).map((entry) => (
            <TopTenChartEntry key={entry.track_id} {...entry} />
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full flex justify-center bg-gradient-to-b from-transparent to-5% to-white z-20">
        <div className="max-w-8xl mb-8 mx-auto min-w-6xl mt-5 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden z-20">
          <div className="hidden sm:flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <div className="min-w-[60px]">Pos</div>
            <div className="w-12"></div>
            <div className="flex-1">Track</div>
            <div className="flex items-center gap-6">
              <div className="text-center min-w-[40px]">Last</div>
              <div className="text-center min-w-[40px]">Peak</div>
              <div className="text-center min-w-[40px]">Wks</div>
              <div className="text-center min-w-[60px]">Plays</div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {chartEntries.slice(40).map((entry) => (
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

      <div className="h-[20000px]"></div>
    </div>
  );
};
