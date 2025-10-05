import { SongChart } from "./types";
import { generatePlaylist } from "./utils/generate_playlist";
import { getLastChartGenerationTimestamp } from "./utils/get_last_generation_timestamp";
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

  // Step 2. Fetch latest chart generation timestamp
  let lastChartGenerationTimestamp: string | null = null;
  try {
    lastChartGenerationTimestamp = await getLastChartGenerationTimestamp();
  } catch (error: any) {
    console.error(
      "Error fetching last chart generation timestamp:",
      error.message
    );
    return;
  }

  if (!lastChartGenerationTimestamp) {
    console.error("No last chart generation timestamp found.");
    return;
  }

  // Step 3. Fetch latest chart from S3

  let songChart: SongChart | null = null;

  try {
    songChart = await getSongChart(lastChartGenerationTimestamp);
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
