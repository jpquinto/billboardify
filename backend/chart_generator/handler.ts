import { Banner, ListeningHistoryDynamoDBItem, SongChartData } from "./types";
import {
  aggregateListeningHistory,
  calculateSongChartPointsFromListeningHistory,
} from "./songs/aggregate_songs";
import { calculateSongChart } from "./songs/calculate_song_chart";
import { fetchListeningHistory } from "./utils/fetch_listening_history";
import { generateSongChartSummary } from "./songs/generate_song_chart_summary";
import { scrapeBanners } from "./utils/get_banner_images";
import { getLastChartGenerationTimestamp } from "./utils/get_last_chart_generation_timestamp";
import { updateLastChartGenerationTimestamp } from "./utils/update_last_chart_generation_timestamp";
import { uploadSongChart } from "./songs/upload_song_chart";

export const handler = async () => {
  console.log("Chart Generator Handler Triggered");

  // Step 1. Get last chart generation timestamp
  let lastChartGenerationTimestamp: string | null = null;
  try {
    lastChartGenerationTimestamp = await getLastChartGenerationTimestamp();
  } catch (error: any) {
    console.error("Error getting last chart generation timestamp:", error);
    throw new Error(error);
  }

  if (!lastChartGenerationTimestamp) {
    console.log("No previous chart generation timestamp found.");
    return;
  }

  // Step 2. Fetch new data since last timestamp for aggregation
  let listeningHistory: ListeningHistoryDynamoDBItem[] | null = null;
  const lastGenerationDate = new Date(lastChartGenerationTimestamp);
  const threeWeeksInMillis = 3 * 7 * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(
    lastGenerationDate.getTime() - threeWeeksInMillis
  );
  const cutoffTimestamp = cutoffDate.toISOString();
  try {
    listeningHistory = await fetchListeningHistory(cutoffTimestamp);
  } catch (error: any) {
    console.error("Error fetching listening history:", error);
    throw new Error(error);
  }

  if (!listeningHistory || listeningHistory.length === 0) {
    console.log("No new listening history to process for charts.");
    return;
  }

  // Step 3. Aggregate song data to update plays since last chart generation
  const aggregatedListeningHistory = aggregateListeningHistory(
    lastChartGenerationTimestamp,
    listeningHistory
  );

  // Step 4. Calculate current chart points from last three week listening history
  const currentChartPointData =
    calculateSongChartPointsFromListeningHistory(listeningHistory);

  console.log("Current Song Chart Point Data: ", currentChartPointData);

  // Step 5. Generate song chart data
  const chartTimestamp = new Date().toISOString();

  let chart: SongChartData[] = [];
  try {
    chart = await calculateSongChart(
      aggregatedListeningHistory,
      currentChartPointData,
      chartTimestamp
    );
  } catch (error: any) {
    console.error("Error calculating song chart:", error);
    throw new Error(error);
  }

  if (chart.length === 0) {
    console.log("No chart data generated.");
    return;
  }

  const top100Chart: SongChartData[] = [];
  const top100TrackIds = new Set<string>();

  for (const song of chart) {
    if (song.position <= 100) {
      top100Chart.push(song);
      top100TrackIds.add(song.track_id);
    }
  }

  console.log(`Top 100 chart entries: ${top100Chart.length}`);
  console.log(`Top 100 track IDs: ${top100TrackIds.size}`);

  // Step 5. Generate chart summary
  const chartSummary = await generateSongChartSummary(
    top100Chart,
    chart.length
  );

  // Step 6. Get banner images to display on chart pages
  let banners: Banner[] = [];
  // try {
  //   const artists: { artist_id: string; artist_name: string }[] = [];
  //   artists.push({
  //     artist_id: top100Chart[0].artist_id,
  //     artist_name: top100Chart[0].artist_name,
  //   });

  //   if (chartSummary.most_charted_artists.length > 0) {
  //     // Get the ID of the artist already in the array to avoid duplication
  //     const existingArtistId = artists[0].artist_id;

  //     let addedCount = 0;
  //     for (const most_charted_artist of chartSummary.most_charted_artists) {
  //       if (
  //         most_charted_artist.artist_id !== existingArtistId &&
  //         addedCount < 2
  //       ) {
  //         artists.push({
  //           artist_id: most_charted_artist.artist_id,
  //           artist_name: most_charted_artist.artist_name,
  //         });
  //         addedCount++;
  //       }
  //     }
  //   }

  //   banners = await scrapeBanners({ artists });
  // } catch (error: any) {
  //   console.error("Error fetching banner images:", error);
  //   // Continue without banners
  // }

  // Step 5. Upload JSON file to song chart storage (S3)
  try {
    await uploadSongChart(top100Chart, chartSummary, banners, chartTimestamp);
  } catch (error: any) {
    console.error("Error uploading chart JSON file:", error);
    throw new Error(error);
  }

  // Step 6. Update song info from last chart that didn't make it to this chart
  // Step 7. Update last chart generation timestamp
  try {
    await updateLastChartGenerationTimestamp(chartTimestamp);
  } catch (error: any) {
    console.error("Error updating chart generation timestamp:", error);
    throw new Error(error);
  }
};
