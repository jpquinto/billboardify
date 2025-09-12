"use client";

import Link from "next/link";
import { AlbumChartEntry as AlbumChartEntryType } from "@/types/chart-data";
import { LiquidGlassContainer } from "../ui/liquid-glass-container";
import { ImageGradientTransition } from "../ui/image-gradient";

export const PodiumAlbumChartEntry = (entry: AlbumChartEntryType) => {
  const getPositionChangeIcon = () => {
    if (!entry.last_week) {
      return <span className="text-blue-500 text-xl font-semibold">NEW</span>;
    }

    const positionAdjustment = entry.position - (entry.last_week || 0);

    if (positionAdjustment < 0) {
      return <span className="text-green-500 text-xl">▲</span>;
    } else if (positionAdjustment > 0) {
      return <span className="text-red-500 text-xl">▼</span>;
    } else {
      return <span className="text-gray-400 text-xl">—</span>;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="py-5">
      <LiquidGlassContainer innerClassName="relative">
        <div className="max-w-8xl mx-auto min-w-6xl w-full flex items-center gap-8 p-4 py-15 border-gray-200 transition-colors">
          {/* Position */}
          <div className="flex items-center gap-2 min-w-[60px]">
            {getPositionChangeIcon()}
            <span className="text-8xl font-bold text-gray-900">
              {entry.position}
            </span>
          </div>

          {/* Track & Artist Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/track/${entry.album_id}`} className="group">
              <h3 className="font-semibold text-gray-900 truncate transition-colors text-5xl tracking-tighter pb-3">
                {entry.album_name.length > 25
                  ? entry.album_name.slice(0, 25) + "..."
                  : entry.album_name}
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
                {formatNumber(entry.total_plays_since_last_week)}
              </div>
            </div>
          </div>
        </div>
        <div
          className="absolute top-0 left-0 w-full h-full overflow-hidden"
          style={{ filter: `blur(1px)` }}
        >
          <ImageGradientTransition
            imageUrl={entry.album_cover_url}
            gradientWidth={700}
            className="w-full h-full object-cover opacity-30"
          />
        </div>
      </LiquidGlassContainer>
    </div>
  );
};
