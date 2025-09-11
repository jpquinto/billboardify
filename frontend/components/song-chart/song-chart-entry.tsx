"use client";

import Link from "next/link";
import { SongChartEntry as SongChartEntryType } from "@/types/chart-data";

export const SongChartEntry = (entry: SongChartEntryType) => {
  const getPositionChangeIcon = () => {
    if (!entry.last_week) {
      return <span className="text-blue-500 text-xl font-semibold">NEW</span>;
    }

    const positionAdjustment = entry.position - (entry.last_week || 0);

    if (positionAdjustment > 0) {
      return <span className="text-green-500 text-xl">▲</span>;
    } else if (positionAdjustment < 0) {
      return <span className="text-red-500 text-xl">▼</span>;
    } else {
      return <span className="text-gray-400 text-xl">—</span>;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <section
      className="flex items-center gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
      id={entry.position.toString()}
    >
      {/* Position */}
      <div className="flex items-center gap-2 min-w-[60px]">
        <span className="text-2xl font-bold text-gray-900">
          {entry.position}
        </span>
        {getPositionChangeIcon()}
      </div>

      {/* Album Cover */}
      <div className="flex-shrink-0">
        <img
          src={entry.album_cover}
          alt={`${entry.album_name} cover`}
          className="w-12 h-12 rounded object-cover"
        />
      </div>

      {/* Track & Artist Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/track/${entry.track_id}`} className="group">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
            {entry.track_name}
          </h3>
          <p className="text-sm text-gray-600 truncate">{entry.artist_name}</p>
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
    </section>
  );
};
