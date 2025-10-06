"use client";

import Link from "next/link";
import { SongChartEntry as SongChartEntryType } from "@/types/chart-data";
import { LiquidGlassContainer } from "../ui/liquid-glass-container";
import Container from "../ui/container";

export const FirstPlaceChartEntry = (entry: SongChartEntryType) => {
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
    <Container>
      <div className="pt-[10rem] pb-20 scale-[1.04] hover:scale-[1.08] transition-all">
        <LiquidGlassContainer
        // style={{
        //   boxShadow: `inset 0px -5px 10px -5px #8200db,
        //     inset 0px -6px 7px -3px #fb64b6,
        //     inset 0px -8px 5px -1px #ffba00,
        //     0px 4px 12px rgba(0, 0, 0, 0.1),
        //     0px 2px 6px rgba(255, 255, 255, 0.2)`,
        // }}
        >
          <div className="mx-auto min-w-6xl w-full flex flex-col justify-center items-center gap-8 p-4 border-gray-200 transition-colors">
            <LiquidGlassContainer className="mr-auto flex justify-start w-full px-8 bg-gray-100/30">
              <div className="flex items-center w-full gap-8">
                {/* Position */}
                <div className="flex items-center gap-2 min-w-[60px]">
                  {getPositionChangeIcon()}
                  <span className="text-9xl font-bold bg-gradient-to-br from-purple-700 via-pink-400 to-amber-400 bg-clip-text text-transparent drop-shadow-2xl">
                    {entry.position}
                  </span>
                </div>

                {/* Album Cover */}
                <div className="flex-shrink-0 rounded-2xl overflow-hidden m-2 relative shadow-2xl">
                  <img
                    src={entry.album_cover}
                    alt={`${entry.album_name} cover`}
                    className="w-40 h-40 rounded-2xl object-cover"
                  />
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      boxShadow: `inset 0px -4px 10px -5px #8200db, 
                      inset 0px -6px 7px -3px #fb64b6,
                      inset 0px -8px 5px -1px #ffba00`,
                    }}
                  />
                </div>

                {/* Track & Artist Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/tracks/${entry.track_id}`} className="group">
                    <h3 className="font-semibold text-gray-900 truncate transition-colors text-5xl tracking-tighter">
                      {entry.track_name.length > 25
                        ? entry.track_name.slice(0, 25) + "..."
                        : entry.track_name}
                    </h3>
                    <p className="text-3xl text-gray-800 truncate font-bold">
                      {entry.artist_name.length > 45
                        ? entry.artist_name.slice(0, 45) + "..."
                        : entry.artist_name}
                    </p>
                  </Link>
                </div>
              </div>
            </LiquidGlassContainer>
            <div>
              {/* Chart Stats */}
              <div className="flex items-center gap-12 text-xl text-gray-800">
                {/* Last Week */}
                <div className="text-center min-w-[40px]">
                  <div className="text-xl text-gray-900 font-semibold tracking-tighter uppercase">
                    Last
                  </div>
                  <div className="font-bold">
                    {entry.last_week && entry.last_week <= 100
                      ? entry.last_week
                      : "—"}
                  </div>
                </div>

                {/* Peak */}
                <div className="text-center min-w-[40px]">
                  <div className="text-xl text-gray-900 font-semibold tracking-tighter uppercase">
                    Peak
                  </div>
                  <div className="font-bold">{entry.peak}</div>
                </div>

                {/* Weeks on Chart */}
                <div className="text-center min-w-[40px]">
                  <div className="text-xl text-gray-900 font-semibold tracking-tighter uppercase">
                    Wks
                  </div>
                  <div className="font-bold">{entry.weeks_on_chart}</div>
                </div>

                {/* Plays */}
                <div className="text-center min-w-[60px]">
                  <div className="text-xl text-gray-900 font-semibold tracking-tighter uppercase">
                    PTS
                  </div>
                  <div className="font-bold">{formatNumber(entry.points)}</div>
                </div>
              </div>
            </div>
          </div>
        </LiquidGlassContainer>
      </div>
    </Container>
  );
};
