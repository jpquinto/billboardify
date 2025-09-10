import { SongChartEntry } from "../types";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

/**
 * Remove all tracks from a playlist
 * @param playlistId - Spotify playlist ID
 */
const clearPlaylist = async (
  playlistId: string,
  accessToken: string
): Promise<void> => {
  try {
    console.log(`Clearing all tracks from playlist ${playlistId}...`);

    // Get all tracks in the playlist
    let allTracks: any[] = [];
    let nextUrl = `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=100`;

    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch playlist tracks: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      allTracks = [...allTracks, ...data.items];
      nextUrl = data.next;
    }

    if (allTracks.length === 0) {
      console.log("Playlist is already empty");
      return;
    }

    // Remove tracks in batches of 100 (Spotify API limit)
    const batchSize = 100;
    for (let i = 0; i < allTracks.length; i += batchSize) {
      const batch = allTracks.slice(i, i + batchSize);
      const tracksToRemove = batch.map((item) => ({
        uri: item.track.uri,
      }));

      const response = await fetch(
        `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tracks: tracksToRemove,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to remove tracks: ${response.status} ${response.statusText}`
        );
      }
    }

    console.log(`Removed ${allTracks.length} tracks from playlist`);
  } catch (error) {
    console.error("Error clearing playlist:", error);
    throw error;
  }
};

/**
 * Add tracks to a playlist
 * @param playlistId - Spotify playlist ID
 * @param trackUris - Array of Spotify track URIs
 */
const addTracksToPlaylist = async (
  playlistId: string,
  trackUris: string[],
  accessToken: string
): Promise<void> => {
  try {
    console.log(
      `Adding ${trackUris.length} tracks to playlist ${playlistId}...`
    );

    // Add tracks in batches of 100 (Spotify API limit)
    const batchSize = 100;
    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize);

      const response = await fetch(
        `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: batch,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to add tracks: ${response.status} ${response.statusText}`
        );
      }
    }

    console.log(`Successfully added ${trackUris.length} tracks to playlist`);
  } catch (error) {
    console.error("Error adding tracks to playlist:", error);
    throw error;
  }
};

/**
 * Update playlist description with timestamp
 * @param playlistId - Spotify playlist ID
 * @param accessToken - Spotify access token
 */
const updatePlaylistDescription = async (
  playlistId: string,
  accessToken: string
): Promise<void> => {
  try {
    const currentTimestamp = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const description = `My Current Hot 100 Playlist! Last Updated ${currentTimestamp}`;

    console.log(
      `Updating playlist description with timestamp: ${currentTimestamp}`
    );

    const response = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${playlistId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: description,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to update playlist description: ${response.status} ${response.statusText}`
      );
    }

    console.log("Playlist description updated successfully");
  } catch (error) {
    console.error("Error updating playlist description:", error);
    throw error;
  }
};

/**
 * Generate playlist from chart entries - clears existing tracks and adds new ones in chart order
 * @param playlistId - Spotify playlist ID
 * @param chartEntries - Array of song chart entries sorted by position
 * @returns Object with results of the operation
 */
export const generatePlaylist = async (
  playlistId: string,
  chartEntries: SongChartEntry[],
  accessToken: string
): Promise<{
  tracksAdded: number;
  totalEntries: number;
}> => {
  try {
    console.log(
      `Generating playlist ${playlistId} with ${chartEntries.length} chart entries...`
    );

    // Step 1: Clear existing playlist
    await clearPlaylist(playlistId, accessToken);

    // Step 2: Sort chart entries by position to ensure correct order
    const sortedEntries = [...chartEntries].sort(
      (a, b) => a.position - b.position
    );

    // Step 3: Convert track IDs to URIs
    const trackUris: string[] = sortedEntries.map(
      (entry) => `spotify:track:${entry.track_id}`
    );

    console.log(`Converting ${sortedEntries.length} track IDs to URIs...`);

    // Step 4: Add tracks to playlist in order
    if (trackUris.length > 0) {
      await addTracksToPlaylist(playlistId, trackUris, accessToken);
    }

    // Step 5: Update playlist description with current timestamp
    await updatePlaylistDescription(playlistId, accessToken);

    const result = {
      tracksAdded: trackUris.length,
      totalEntries: chartEntries.length,
    };

    console.log(
      `Playlist generation complete: ${result.tracksAdded} tracks added from ${result.totalEntries} chart entries`
    );

    return result;
  } catch (error) {
    console.error("Error generating playlist:", error);
    throw error;
  }
};
