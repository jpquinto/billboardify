"use client";

import { useEffect, useState, use } from "react";
import { getAlbumMetadata } from "@/actions/get-album-metadata";
import { ListeningHistoryChart } from "@/components/listening-history-chart/listening-history-chart";
import Container from "@/components/ui/container";
import { parseColorToRgb } from "@/utils/parse-rgb";
import { AlbumMetadata } from "@/types/album-metadata";
import { AlbumMetadataCard } from "@/components/albums/album-metadata-card";
import { AlbumHero } from "@/components/albums/album-hero";

export default function AlbumPage({
  params,
}: {
  params: Promise<{ album_id: string }>;
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [albumMetadata, setAlbumMetadata] = useState<AlbumMetadata | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const albumMetadata = await getAlbumMetadata(resolvedParams.album_id);

        setAlbumMetadata(albumMetadata);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load chart data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.album_id]);

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

  const primaryColor =
    parseColorToRgb(albumMetadata?.cover_primary_color) || undefined;
  const secondaryColor =
    parseColorToRgb(albumMetadata?.cover_secondary_color) || undefined;

  return (
    <main className="flex-1">
      <div>
        <AlbumHero
          album_cover_banner={
            albumMetadata?.album_cover_banner || "/banner-placeholder.png"
          }
          artist_name={albumMetadata?.artist_name || "Unknown Artist"}
          album_name={albumMetadata?.album_name || "Unknown Album"}
        />
        <Container className="-translate-y-10 pt-20 relative">
          <div className="grid grid-cols-2 gap-x-5">
            <ListeningHistoryChart
              type={"album"}
              id={resolvedParams.album_id}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
            <div>
              <AlbumMetadataCard
                albumMetadata={albumMetadata!}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
              />
            </div>
          </div>
        </Container>
      </div>
    </main>
  );
}
