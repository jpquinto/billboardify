"use client";

import { useEffect, useState } from "react";
import { SongChart } from "@/components/song-chart/song-chart";
import { SongChart as SongChartType } from "@/types/chart-data";
import { getSongChart } from "@/actions/get-song-chart";
import { ArtistChart } from "@/components/artist-chart/artist-chart";
import { listSongCharts } from "@/actions/list-song-charts";

export default function Artist25() {
  const [chartTimestampsList, setChartTimestampsList] = useState<string[]>([]);
  const [latestChartData, setlatestChartData] = useState<SongChartType | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Step 1: List charts to get the latest timestamp
        const chartsData = await listSongCharts();

        if (chartsData.charts.length === 0) {
          setError("No charts available");
          setLoading(false);
          return;
        }

        if (!chartsData.charts[0].timestamp) {
          setError("Invalid chart data");
          setLoading(false);
          return;
        }

        setChartTimestampsList(
          chartsData.charts.map((chart) => chart.timestamp)
        );
        const timestamp = chartsData.charts[0].timestamp;

        // Step 2: Fetch the actual chart data using the timestamp
        const chartData = await getSongChart(timestamp);
        setlatestChartData(chartData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load chart data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  if (!latestChartData) {
    return (
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            No chart data available
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <ArtistChart
        chartData={latestChartData}
        timestamp={latestChartData.timestamp}
      />
    </main>
  );
}
