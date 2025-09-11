import { ListeningHistoryItem } from "listening_history_ingestor/handler";

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } =
  process.env;

/**
 * Gets a new Spotify access token using the refresh token.
 * @returns The new access token string.
 */
const getAccessToken = async (): Promise<string> => {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    throw new Error("Missing Spotify API environment variables.");
  }

  const authString = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${authString}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.access_token;
};

/**
 * Ingests recent listening data from the Spotify API.
 * @returns A promise that resolves to an array of listening history items.
 */
export const ingestRecentListeningData = async (
  lastTimestamp: string
): Promise<ListeningHistoryItem[]> => {
  try {
    // Step 1: Get a new access token
    const accessToken = await getAccessToken();

    // Step 2: Call the Spotify "Recently Played" endpoint
    let url = "https://api.spotify.com/v1/me/player/recently-played?limit=50";
    if (lastTimestamp) {
      // The 'after' parameter is a Unix timestamp in milliseconds
      const afterTimestamp = new Date(lastTimestamp).getTime();
      url += `&after=${afterTimestamp}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Spotify API request failed: ${response.status} - ${error}`
      );
    }

    const data = await response.json();

    // Step 3: Map the response to our data model
    const listeningItems: ListeningHistoryItem[] = data.items.map(
      (item: any) => ({
        trackId: item.track.id,
        trackName: item.track.name,
        artistName: item.track.artists
          .map((artist: any) => artist.name)
          .join(", "),
        albumName: item.track.album.name,
        playedAt: item.played_at,
        artistId: item.track.artists[0]?.id,
        albumId: item.track.album.id,
        albumCoverUrl: item.track.album.images[0]?.url,
      })
    );

    console.log(`Successfully ingested ${listeningItems.length} new tracks.`);
    return listeningItems;
  } catch (error) {
    console.error("Error during ingestion process:", error);
    return [];
  }
};
