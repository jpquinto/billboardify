import { SongChart } from "./types";
import { generatePlaylist } from "./utils/generate_playlist";
import { getSongChart } from "./utils/get_latest_chart";
import { getOrCreatePlaylist } from "./utils/get_playlist";

const getAccessToken = require("/opt/nodejs/get_access_token").default;

export const handler = async () => {
  console.log("Playlist Manager Handler Triggered");

  // Step 1. Get Spotify access token
  let accessToken: string | null = null;
  try {
    accessToken = await getAccessToken();
  } catch (error: any) {
    console.error("Error getting access token:", error.message);
    return;
  }

  if (!accessToken) {
    console.error("No access token retrieved.");
    return;
  }

  // Step 1. Check if playlist exists. If not, create one
  let playlistId: string | null = null;
  try {
    playlistId = await getOrCreatePlaylist("My Hot 100", accessToken);
  } catch (error: any) {
    console.error("Error getting or creating playlist:", error.message);
    return;
  }

  if (!playlistId) {
    console.error("Failed to get or create playlist.");
    return;
  }

  console.log(`Using playlist ID: ${playlistId}`);

  // Step 2. Fetch latest chart from S3

  let songChart: SongChart | null = null;

  try {
    songChart = await getSongChart("2025-09-10T08:12:39.822Z");
  } catch (error: any) {
    console.error("Error fetching song chart:", error.message);
    return;
  }

  if (!songChart) {
    console.error("No song chart data retrieved.");
    return;
  }

  // Step 4. Update playlist with new chart data
  try {
    await generatePlaylist(playlistId, songChart.chart_data, accessToken);
  } catch (error: any) {
    console.error("Error generating playlist:", error.message);
    return;
  }
};
