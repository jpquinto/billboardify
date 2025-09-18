import { ListeningHistoryItem } from "listening_history_ingestor/handler";
import { getSongGenre } from "./get_song_genre";
import { getArtistImage } from "./get_artist_image";

const getAccessToken = require("/opt/nodejs/get_access_token").default;

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

    const foundGenres: Record<string, string> = {}; // Cache by track_id
    const foundGenresByArtist: Record<string, string> = {}; // Cache by artist_id
    const foundArtistImages: Record<string, string> = {}; // Cache artist images by artist_id

    // Step 3: Map the response to our data model with genres
    const listeningItems: ListeningHistoryItem[] = [];

    for (const item of data.items) {
      console.log(
        `Processing track: ${item.track.name} by ${item.track.artists
          .map((artist: any) => artist.name)
          .join(", ")}`
      );
      // Create the base listening item
      const listeningItem: ListeningHistoryItem = {
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
      };

      // Get the genre using our optimized helper function
      if (listeningItem.artistId) {
        try {
          const genre = await getSongGenre(
            listeningItem.trackId,
            listeningItem.artistId,
            accessToken,
            foundGenres,
            foundGenresByArtist
          );

          listeningItem.genre = genre;
        } catch (error) {
          console.error(
            `Failed to get genre for track ${listeningItem.trackId}:`,
            error
          );
          listeningItem.genre = null;
        }
        // Get artist image with caching
        try {
          let artistImageUrl = foundArtistImages[listeningItem.artistId];

          if (!artistImageUrl) {
            console.log(
              `Fetching artist image for ${listeningItem.artistName}...`
            );
            artistImageUrl =
              (await getArtistImage(listeningItem.artistId)) || "";

            // Cache the result (even if null) to avoid repeated API calls
            foundArtistImages[listeningItem.artistId] = artistImageUrl;
          }

          listeningItem.artistImageUrl = artistImageUrl || null;
        } catch (error) {
          console.error(
            `Failed to get artist image for artist ${listeningItem.artistId}:`,
            error
          );
          listeningItem.artistImageUrl = null;
        }
      } else {
        listeningItem.genre = null;
        listeningItem.artistImageUrl = null;
      }

      listeningItems.push(listeningItem);
    }

    console.log(`Successfully ingested ${listeningItems.length} new tracks.`);
    return listeningItems;
  } catch (error) {
    console.error("Error during ingestion process:", error);
    return [];
  }
};
