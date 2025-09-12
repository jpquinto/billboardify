"use client";

import { getCurrentlyPlaying } from "@/actions/get-currently-playing";
import { SpotifyPlaybackState } from "@/types/spotify";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { LiquidGlassContainer } from "./ui/liquid-glass-container";
import { usePathname } from "next/navigation";
import { getAccessToken } from "@/actions/get-access-token";

export default function MediaPlayer() {
  const [playbackState, setPlaybackState] =
    useState<SpotifyPlaybackState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string>("");
  const pathname = usePathname();

  const fetchPlaybackState = async () => {
    try {
      setError(null);

      // Get fresh access token if needed
      let token = accessToken;
      if (!token) {
        token = await getAccessToken();
        setAccessToken(token);
      }

      const state = await getCurrentlyPlaying(token);
      setPlaybackState(state);
    } catch (err) {
      console.error("Error fetching playback state:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch playback state"
      );

      // Try to refresh token on auth error
      if (err instanceof Error && err.message.includes("401")) {
        try {
          const newToken = await getAccessToken();
          setAccessToken(newToken);
          const state = await getCurrentlyPlaying(newToken);
          setPlaybackState(state);
          setError(null);
        } catch (refreshErr) {
          setError("Authentication failed");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaybackState();

    // Poll
    const interval = setInterval(fetchPlaybackState, 2000);

    return () => clearInterval(interval);
  }, []);

  const paths: any = {
    "/charts/hot-100":
      "linear-gradient(to right, #8200db 0%, #fb64b6 50%, #ffba00 100%)",
    "/charts/artists-25":
      "linear-gradient(to bottom right, #1d4ed8 0%, #06b6d4 50%, #6ee7b7 100%)",
    "/charts/albums-50":
      "linear-gradient(to bottom right, #B91C1C 0%, #F97316 50%, #FCD34D 100%)",
  };

  const progressBarBackground = paths[pathname] || paths["/hot-100"];

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-lg animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-white/20 rounded mb-2 animate-pulse"></div>
            <div className="h-3 bg-white/20 rounded w-3/4 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500 text-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <span>Error: {error}</span>
          <button
            onClick={fetchPlaybackState}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!playbackState || !playbackState.item) {
    return (
      <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
            <Pause className="w-8 h-8 text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Nothing playing</p>
            <p className="text-sm text-gray-400">
              Start playing music on Spotify
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (playbackState && playbackState.item) {
    const albumCoverUrl = playbackState.item.album.images[1].url;
    const songTitle = playbackState.item.name;
    const artistNames = playbackState.item.artists
      .map((artist) => artist.name)
      .join(", ");

    const progressPercent = playbackState.item
      ? (playbackState.progress_ms / playbackState.item.duration_ms) * 100
      : 0;

    return (
      <div className="flex bg-gradient-to-t from-white to-transparent">
        <LiquidGlassContainer className="p-6 rounded-lg flex items-start justify-center 2xl:justify-end border-none shadow-none">
          <div className="flex min-w-[30rem] pb-[10px]">
            {/* Album Cover */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <Image
                src={albumCoverUrl}
                alt={songTitle}
                width={64}
                height={64}
                className="rounded-lg shadow-md"
              />
            </div>

            {/* Song and Artist Info */}
            <div className="ml-4 flex min-w-0 flex-grow">
              <div className="my-auto text-gray-900">
                <p className="font-bold text-xl truncate">
                  {songTitle.length > 25
                    ? `${songTitle.substring(0, 25)}...`
                    : songTitle}
                </p>
                <p className="text-base truncate">
                  {artistNames.length > 30
                    ? `${artistNames.substring(0, 30)}...`
                    : artistNames}
                </p>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center space-x-3 ml-4">
              {/* Previous Button */}
              <button className="p-2 rounded-full bg-gray-400/40 hover:bg-gray-400/60 transition-colors duration-200 hover:cursor-pointer">
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              {/* Play/Pause Button */}
              <button className="p-3 rounded-full bg-gray-400/50 hover:bg-gray-400/70 transition-colors duration-200 hover:cursor-pointer">
                {/* <svg
                  className="w-6 h-6 text-gray-700"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg> */}
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              </button>

              {/* Skip Button */}
              <button className="p-2 rounded-full bg-gray-400/40 hover:bg-gray-400/60 transition-colors duration-200 hover:cursor-pointer">
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="absolute bottom-0 w-full left-0 h-1 mx-2 mb-[6px]">
            <div className="relative" style={{ width: `calc(100% - 16px)` }}>
              <div
                className="h-1 rounded-full transition-all duration-2000 ease-linear "
                style={{
                  width: `${progressPercent}%`,
                  background: progressBarBackground,
                }}
              ></div>
            </div>
          </div>
        </LiquidGlassContainer>
      </div>
    );
  }
}
