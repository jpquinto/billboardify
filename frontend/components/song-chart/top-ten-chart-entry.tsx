"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SongChartEntry as SongChartEntryType } from "@/types/chart-data";
import { LiquidGlassContainer } from "../ui/liquid-glass-container";

export const TopTenChartEntry = (entry: SongChartEntryType) => {
  const getPositionChangeIcon = () => {
    if (entry.position_adjustment === "up") {
      return <span className="text-green-500 text-xl">▲</span>;
    } else if (entry.position_adjustment === "down") {
      return <span className="text-red-500 text-xl">▼</span>;
    } else if (entry.position_adjustment === "DEBUT") {
      return <span className="text-blue-500 text-base font-semibold">NEW</span>;
    } else {
      return <span className="text-gray-400 text-xl">—</span>;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const [isVisible, setIsVisible] = useState(false);
  const componentRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target); // Stop observing once it's visible
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the component is visible
      }
    );

    if (componentRef.current) {
      observer.observe(componentRef.current);
    }

    return () => {
      if (componentRef.current) {
        observer.unobserve(componentRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={componentRef}
      className="pb-5 transition-all"
      style={{
        transform: isVisible ? "scale(1)" : "scale(0.9)",
        transition: "transform 0.5s ease-out, opacity 0.5s ease-out",
      }}
      id={entry.position.toString()}
    >
      <LiquidGlassContainer>
        <div className="max-w-8xl mx-auto min-w-6xl w-full flex items-center gap-8 p-4 border-gray-200 transition-colors">
          {/* Position */}
          <div className="flex items-center gap-2 min-w-[60px]">
            {getPositionChangeIcon()}
            <span className="text-5xl font-bold text-gray-900">
              {entry.position}
            </span>
          </div>

          {/* Album Cover */}
          <div className="flex-shrink-0">
            <img
              src={entry.album_cover}
              alt={`${entry.album_name} cover`}
              className="w-20 h-20 rounded object-cover"
            />
          </div>

          {/* Track & Artist Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/track/${entry.track_id}`} className="group">
              <h3 className="font-semibold text-gray-900 truncate group-hover:bg-gradient-to-br group-hover:from-purple-700 group-hover:via-pink-400 group-hover:to-amber-400 group-hover:bg-clip-text group-hover:text-transparent transition-colors text-4xl tracking-tighter pb-2">
                {entry.track_name.length > 30
                  ? entry.track_name.slice(0, 30) + "..."
                  : entry.track_name}
              </h3>
              <p className="text-xl text-gray-900 truncate font-bold">
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
    </section>
  );
};
