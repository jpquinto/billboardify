"use client";

import { useEffect, useState } from "react";
import Container from "@/components/ui/container";
import { SongHero } from "@/components/songs/song-hero";
import {
  LeaderboardSummary as LeaderboardSummaryType,
  SongLeaderboardEntry,
} from "@/types/leaderboard";
import { getCurrentDate, getDateDaysAgo } from "@/utils/date";
import { getLeaderboard } from "@/actions/get-leaderboard";
import { LeaderboardSummary } from "@/components/leaderboards/leaderboard-summary";
import { SongsLeaderboard } from "@/components/songs/songs-leaderboard";

export default function SongsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<LeaderboardSummaryType | null>(null);
  const [songLeaderboard, setSongLeaderboard] = useState<
    SongLeaderboardEntry[] | null
  >(null);
  const [startDate, setStartDate] = useState<string>(getDateDaysAgo(30));
  const [endDate, setEndDate] = useState<string>(getCurrentDate());
  const [granularity, setGranularity] = useState<
    "daily" | "monthly" | "yearly"
  >("daily");
  const [offset, setOffset] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getLeaderboard(
          "song",
          granularity,
          offset,
          startDate,
          endDate
        );

        if (
          !response.data.leaderboard ||
          response.data.leaderboard.length === 0
        ) {
          setError("No data available for the selected parameters.");
          setSongLeaderboard(null);
          setSummary(null);
          return;
        }

        setSongLeaderboard(response.data.leaderboard as SongLeaderboardEntry[]);
        setSummary(response.data.summary);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load leaderboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, granularity, offset]);

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
        <Container className="-translate-y-10 pt-20 relative overflow-visible">
          <div className="grid grid-cols-3 gap-x-10 relative min-h-screen">
            <div className="col-span-2">
              <SongsLeaderboard leaderboard={songLeaderboard!} />
            </div>
            <div className="relative">
              <div className="sticky top-0">
                <LeaderboardSummary summary={summary!} />
              </div>
            </div>
          </div>
        </Container>
      </div>
    </main>
  );
}
