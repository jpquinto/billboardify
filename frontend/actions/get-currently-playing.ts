"use server";

import { SpotifyPlaybackState } from "@/types/spotify";

export async function getCurrentlyPlaying(
  accessToken: string
): Promise<SpotifyPlaybackState | null> {
  const response = await fetch("https://api.spotify.com/v1/me/player", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 204) {
    return null; // No content - nothing playing
  }

  if (!response.ok) {
    throw new Error("Failed to fetch currently playing");
  }

  return response.json();
}
