"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AlbumChartEntry as AlbumChartEntryType } from "@/types/chart-data";
import { LiquidGlassContainer } from "../ui/liquid-glass-container";
import { ImageGradientTransition } from "../ui/image-gradient";
import Container from "../ui/container";
import { parseColorToRgb } from "@/utils/parse-rgb";

export const TopTenAlbumChartEntry = (entry: AlbumChartEntryType) => {
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

  console.log(entry);

  return (
    <section
      ref={componentRef}
      className="pb-5 transition-all relative group"
      style={{
        transform: isVisible ? "scale(1)" : "scale(0.9)",
        transition: "transform 0.5s ease-out, opacity 0.5s ease-out",
      }}
      id={entry.position.toString()}
    >
      <Container>
        <LiquidGlassContainer className="relative overflow-hidden group">
          <div className="mx-auto min-w-6xl min-h-[15rem] w-full flex items-center gap-8 p-4 z-10 py-10 border-gray-200 transition-colors">
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
                <h3
                  className={`font-semibold text-gray-900 truncate transition-colors text-5xl tracking-tighter pb-3 group-hover:bg-gradient-to-br group-hover:bg-clip-text group-hover:text-transparent`}
                >
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
            className="absolute top-0 left-0 w-full h-full group-hover:scale-[1.04] transition-all duration-500"
            style={{ filter: `blur(2px)` }}
          >
            <img
              src={entry.album_cover_banner || entry.album_cover_url}
              alt={entry.album_name}
              className="w-full h-full object-cover opacity-50 rounded-xl"
            />
          </div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white via-transparent to-white"></div>
        </LiquidGlassContainer>
      </Container>
    </section>
  );
};
