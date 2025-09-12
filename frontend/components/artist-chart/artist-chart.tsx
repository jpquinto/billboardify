"use client";

import { ArtistChart as ArtistChartType } from "@/types/chart-data";
import { BannerScroller } from "../ui/banner-scroller";
import { ChartHeader } from "../chart-header";
import { FirstPlaceArtistChartEntry } from "./first-place-artist-chart-entry";
import { TopTenArtistChartEntry } from "./top-ten-artist-chart-entry";

export const ArtistChart = ({
  chartData,
  timestamp,
}: {
  chartData: ArtistChartType;
  timestamp: string;
}) => {
  const { chartData: chartEntries, banners } = chartData;
  return (
    <div className="flex justify-center flex-col mx-auto px-4 pt-30">
      <ChartHeader
        title={"Artists 25"}
        logo={"/artist-chart-logo.png"}
        timestamp={timestamp}
      />

      <div className="relative max-w-8xl">
        <BannerScroller banners={banners.map((banner) => banner.banner_url)} />
        <FirstPlaceArtistChartEntry {...chartEntries[0]} />
        <div className="pt-5">
          {chartEntries.slice(1, 40).map((entry) => (
            <TopTenArtistChartEntry key={entry.artist_id} {...entry} />
          ))}
        </div>
      </div>

      {/* Chart Container */}
      {/* <div className="w-full flex justify-center bg-gradient-to-b from-transparent to-5% to-white z-20">
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
      </div> */}
    </div>
  );
};
