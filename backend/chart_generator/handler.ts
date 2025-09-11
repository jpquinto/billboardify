import {
  ArtistChartData,
  ArtistChartFile,
  Banner,
  ListeningHistoryDynamoDBItem,
  SongChartData,
  SongChartFile,
} from "./types";
import { aggregateSongListeningHistory } from "./songs/aggregate_songs";
import { createSongChartEntryAndAggregatePlayCounts } from "./songs/create_song_chart_entry";
import { fetchListeningHistory } from "./utils/fetch_listening_history";
import { generateSongChartSummary } from "./songs/generate_song_chart_summary";
import { getLastChartGenerationTimestamp } from "./utils/get_last_chart_generation_timestamp";
import { updateLastChartGenerationTimestamp } from "./utils/update_last_chart_generation_timestamp";
import { calculateSongChartPointsFromListeningHistory } from "./songs/calculate_song_chart_points";
import { uploadChart } from "./utils/upload_chart";
import { aggregateArtistListeningHistory } from "./artists/aggregate_artists";
import { calculateArtistChartPointsFromListeningHistory } from "./artists/calculate_artist_chart";
import { createArtistChartEntryAndAggregatePlayCounts } from "./artists/create_artist_chart_entry";
import { extractBannerUrlsMap } from "./utils/utils";
import { resolveBanners } from "./utils/resolve_chart_banners";
import { updateMultipleArtistBanners } from "./artists/update_artist_banners";

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

  // Step 3. Aggregate listening history since last chart generation
  const aggregatedSongListeningHistory = aggregateSongListeningHistory(
    lastChartGenerationTimestamp,
    listeningHistory
  );
  const aggregatedArtistListeningHistory = aggregateArtistListeningHistory(
    lastChartGenerationTimestamp,
    listeningHistory
  );

  // Step 4. Calculate current chart points from last three week listening history
  const currentSongChartPointData =
    calculateSongChartPointsFromListeningHistory(listeningHistory);
  const currentArtistChartPointData =
    calculateArtistChartPointsFromListeningHistory(listeningHistory);

  console.log("Current Artist Chart Point Data: ", currentArtistChartPointData);

  // Step 5. Generate chart entries and update DynamoDB
  const chartTimestamp = new Date().toISOString();

  let songChart: SongChartData[] = [];
  try {
    songChart = await createSongChartEntryAndAggregatePlayCounts(
      aggregatedSongListeningHistory,
      currentSongChartPointData,
      chartTimestamp
    );
  } catch (error: any) {
    console.error("Error calculating song chart:", error);
    throw new Error(error);
  }

  if (songChart.length === 0) {
    console.log("No chart data generated.");
    return;
  }

  let artistChart: ArtistChartData[] = [];
  try {
    artistChart = await createArtistChartEntryAndAggregatePlayCounts(
      aggregatedArtistListeningHistory,
      currentArtistChartPointData,
      chartTimestamp
    );
  } catch (error: any) {
    console.error("Error calculating artist chart:", error);
    throw new Error(error);
  }

  const top100Chart = songChart.slice(0, 100);
  const artist25Chart = artistChart.slice(0, 25);

  console.log(`Top 100 chart entries: ${top100Chart.length}`);

  // Step 5. Generate chart summaries
  const songChartSummary = await generateSongChartSummary(
    top100Chart,
    songChart.length
  );

  // Step 6. Get banner images to display on chart pages
  let scrapedBanners: Banner[] = [];
  let songChartBanners: Banner[] = [];
  let artistChartBanners: Banner[] = [];

  const existingBanners = extractBannerUrlsMap(artistChart);

  try {
    const bannerResult = await resolveBanners({
      top100Chart,
      songChartSummary,
      artist25Chart,
      existingBanners,
    });

    scrapedBanners = bannerResult.scrapedBanners;
    songChartBanners = bannerResult.songChartBanners;
    artistChartBanners = bannerResult.artistChartBanners;
  } catch (error: any) {
    console.error("Error fetching banner images:", error);
    // Continue without banners
  }

  if (scrapedBanners.length > 0) {
    try {
      // Extract artist_id from the scraped banners - you'll need to ensure this is available
      const bannersToUpdate = scrapedBanners.map((banner) => ({
        artist_id: banner.artist_id,
        banner_url: banner.banner_url,
      }));

      await updateMultipleArtistBanners(bannersToUpdate);
      console.log(
        `✅ Successfully updated ${scrapedBanners.length} artist banners in database`
      );
    } catch (error: any) {
      console.error("Error updating artist banners in database:", error);
      // Continue without updating - the banners are still available for this chart generation
    }
  }

  // Step 5. Upload JSON file to song chart storage (S3)
  try {
    await uploadChart(
      {
        chart_data: top100Chart,
        chart_summary: songChartSummary,
        banners: songChartBanners,
      } as SongChartFile,
      `me/songs/${chartTimestamp}.json`
    );
    await uploadChart(
      {
        chart_data: artist25Chart,
        banners: artistChartBanners,
      } as ArtistChartFile,
      `me/artists/${chartTimestamp}.json`
    );
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
