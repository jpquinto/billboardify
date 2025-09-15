"use client";

import { useEffect, useState, use } from "react";
import { chartCache } from "@/hooks/useCache";
import { SongMetadata } from "@/types/song-metadata";
import { getSongMetadata } from "@/actions/get-song-metadata";
import Image from "next/image";
import { ListeningHistoryChart } from "@/components/listening-history-chart/listening-history-chart";
import Container from "@/components/ui/container";
import { SongHero } from "@/components/songs/song-hero";

export default function SongPage({ params }: { params: { track_id: string } }) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [songMetadata, setSongMetadata] = useState<SongMetadata | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Step 1: Check cache first for chart list
        // let chartsData = chartCache.get<{
        //   charts: Array<{ timestamp: string }>;
        // }>("charts_list");
        let songMetadata = null;

        if (!songMetadata) {
          // Cache miss - fetch from API
          songMetadata = await getSongMetadata(resolvedParams.track_id);
          // chartCache.set("charts_list", songMetadata, 0.5); // Cache for 30 minutes
        }

        setSongMetadata(songMetadata);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load chart data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.track_id]);

  if (loading) {
    return (
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">Error loading chart</div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  //   if (!latestChartData) {
  //     return (
  //       <main className="flex-1">
  //         <div className="max-w-6xl mx-auto px-4 py-8">
  //           <div className="text-center text-gray-600">
  //             No chart data available
  //           </div>
  //         </div>
  //       </main>
  //     );
  //   }

  return (
    <main className="flex-1">
      <div>
        <SongHero
          album_cover_banner={
            songMetadata?.album_cover_banner || "/banner-placeholder.png"
          }
          track_name={songMetadata?.track_name || "Unknown Track"}
          artist_name={songMetadata?.artist_name || "Unknown Artist"}
          album_name={songMetadata?.album_name || "Unknown Album"}
        />
        <Container className="-translate-y-10 pt-20 relative">
          <div className="grid grid-cols-2 gap-x-10">
            <div></div>
            <ListeningHistoryChart type={"song"} id={resolvedParams.track_id} />
          </div>
        </Container>
      </div>
    </main>
  );
}
