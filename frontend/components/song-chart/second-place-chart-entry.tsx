"use client";

import Link from "next/link";
import { SongChartEntry as SongChartEntryType } from "@/types/chart-data";
import { LiquidGlassContainer } from "../ui/liquid-glass-container";
import Image from "next/image";

export const SecondPlaceChartEntry = (entry: SongChartEntryType) => {
  const getPositionChangeIcon = () => {
    if (entry.position_adjustment === "up") {
      return <span className="text-green-500 text-xl">▲</span>;
    } else if (entry.position_adjustment === "down") {
      return <span className="text-red-500 text-xl">▼</span>;
    } else if (entry.position_adjustment === "debut") {
      return <span className="text-blue-500 text-xl font-semibold">NEW</span>;
    } else {
      return <span className="text-gray-400 text-xl">—</span>;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="py-5">
      <LiquidGlassContainer>
        <div className="max-w-8xl mx-auto min-w-6xl w-full flex items-center gap-8 p-4 border-gray-200 transition-colors">
          {/* Position */}
          <div className="flex items-center gap-2 min-w-[60px]">
            {getPositionChangeIcon()}
            <span className="text-8xl font-bold text-gray-900">
              {entry.position}
            </span>
          </div>

          {/* Album Cover */}
          <div className="flex-shrink-0">
            <img
              src={entry.album_cover}
              alt={`${entry.album_name} cover`}
              className="w-30 h-30 rounded object-cover"
            />
          </div>

          {/* Track & Artist Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/track/${entry.track_id}`} className="group">
              <h3 className="font-semibold text-gray-900 truncate transition-colors text-5xl tracking-tighter pb-3">
                {entry.track_name.length > 25
                  ? entry.track_name.slice(0, 25) + "..."
                  : entry.track_name}
              </h3>
              <p className="text-2xl text-gray-900 truncate font-bold">
                {entry.artist_name.length > 45
                  ? entry.artist_name.slice(0, 45) + "..."
                  : entry.artist_name}
              </p>
            </Link>
          </div>

          {/* Chart Stats */}
          <div className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            {/* Last Week */}
            <div className="text-center min-w-[40px]">
              <div className="text-xs text-gray-400 uppercase">Last</div>
              <div className="font-medium">{entry.last_week || "—"}</div>
            </div>

            {/* Peak */}
            <div className="text-center min-w-[40px]">
              <div className="text-xs text-gray-400 uppercase">Peak</div>
              <div className="font-medium">{entry.peak}</div>
            </div>

            {/* Weeks on Chart */}
            <div className="text-center min-w-[40px]">
              <div className="text-xs text-gray-400 uppercase">Wks</div>
              <div className="font-medium">{entry.weeks_on_chart}</div>
            </div>

            {/* Plays */}
            <div className="text-center min-w-[60px]">
              <div className="text-xs text-gray-400 uppercase">Plays</div>
              <div className="font-medium">
                {formatNumber(entry.plays_since_last_week)}
              </div>
            </div>
          </div>
        </div>
      </LiquidGlassContainer>
    </div>
  );
};
