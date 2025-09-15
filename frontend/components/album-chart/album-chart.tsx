"use client";

import { AlbumChart as AlbumChartType } from "@/types/chart-data";
import { AlbumChartEntry } from "./album-chart-entry";

import { BannerScroller } from "../ui/banner-scroller";
import { ChartHeader } from "../chart-header";
import { LogoSeparator } from "../ui/logo-separator";
import { FirstPlaceAlbumChartEntry } from "./first-place-album-chart-entry";
import { PodiumAlbumChartEntry } from "./podium-album-chart-entry";
import { TopTenAlbumChartEntry } from "./top-ten-album-chart-entry";
import { ImageGradientTransition } from "../ui/image-gradient";
import { GradientBannerScroller } from "../ui/album-cover-scroller";

export const AlbumChart = ({
  chartData,
  timestamp,
}: {
  chartData: AlbumChartType;
  timestamp: string;
}) => {
  const { chartData: chartEntries } = chartData;

  return (
    <div className="flex justify-center flex-col mx-auto px-4 pt-30">
      <ChartHeader
        title={"Albums 50"}
        logo={"/album-chart-logo.png"}
        timestamp={timestamp}
      />

      <section className="relative max-w-8xl" id="1">
        <div className="pt-5">
          {chartEntries.slice(0, 20).map((entry) => (
            <TopTenAlbumChartEntry key={entry.album_id} {...entry} />
          ))}
        </div>
      </section>

      {/* Chart Container */}
      <div className="w-full flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-5% to-white z-20">
        <LogoSeparator logo="/album-chart-logo.png" />
        <div className="max-w-8xl mb-8 mx-auto min-w-6xl mt-5 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden z-20">
          {/* Chart Column Headers - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <div className="min-w-[60px]">Pos</div>
            <div className="w-12"></div> {/* Album cover space */}
            <div className="flex-1">Album</div>
            <div className="flex items-center gap-6">
              <div className="text-center min-w-[40px]">Last</div>
              <div className="text-center min-w-[40px]">Peak</div>
              <div className="text-center min-w-[40px]">Wks</div>
              <div className="text-center min-w-[60px]">Plays</div>
            </div>
          </div>

          {/* Chart Entries */}
          <div className="divide-y divide-gray-200">
            {chartEntries.slice(20).map((entry) => (
              <AlbumChartEntry key={entry.album_id} {...entry} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
