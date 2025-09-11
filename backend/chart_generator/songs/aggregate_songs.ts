import { CurrentChartPointData, ListeningHistoryDynamoDBItem } from "../types";

// Aggregate listening history to count plays for each song since the last chart generation
// This does not calculate points, just raw play counts since the last chart generation
export const aggregateListeningHistory = (
  lastChartGenerationTimestamp: string,
  listeningHistory: ListeningHistoryDynamoDBItem[]
): Map<string, number> => {
  // Use a map to efficiently count plays for each song
  const songPlayCounts = new Map<string, number>();

  // Use a number for comparison, then format to string at the end
  const lastChartTimestampMs = Date.parse(lastChartGenerationTimestamp);

  for (const item of listeningHistory) {
    // Check if the song was played after the last chart generation
    if (Date.parse(item.timestamp) > lastChartTimestampMs) {
      const currentCount = songPlayCounts.get(item.track_id) || 0;
      songPlayCounts.set(item.track_id, currentCount + 1);
    }
  }

  return songPlayCounts;
};

// Calculate chart points based on listening history over the last three weeks
export const calculateSongChartPointsFromListeningHistory = (
  listeningHistory: ListeningHistoryDynamoDBItem[]
): CurrentChartPointData[] => {
  const songPoints = new Map<string, number>();
  const songDetails = new Map<string, Omit<CurrentChartPointData, "points">>();

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  for (const item of listeningHistory) {
    const playedAt = new Date(item.timestamp);
    let points = 0;

    if (playedAt >= oneWeekAgo) {
      // Last week
      points = 5;
    } else if (playedAt >= twoWeeksAgo) {
      // Week before
      points = 2;
    } else {
      // Week before that
      points = 1;
    }

    const currentPoints = songPoints.get(item.track_id) || 0;
    songPoints.set(item.track_id, currentPoints + points);

    // Store song details if not already present
    if (!songDetails.has(item.track_id)) {
      songDetails.set(item.track_id, {
        track_id: item.track_id,
        track_name: item.track_name,
        artist_name: item.artist_name,
        album_name: item.album_name,
        artist_id: item.artist_id!,
        album_id: item.album_id!,
        album_cover_url: item.album_cover_url!,
        position: 0, // Placeholder, will be set later
      });
    }
  }

  const aggregatedData: CurrentChartPointData[] = [];
  for (const [trackId, points] of songPoints.entries()) {
    const details = songDetails.get(trackId);
    if (details) {
      aggregatedData.push({
        ...details,
        points: points,
      });
    }
  }

  // Sort the aggregated data in descending order by points to rank the songs
  aggregatedData.sort((a, b) => b.points - a.points);

  for (let i = 0; i < aggregatedData.length; i++) {
    aggregatedData[i].position = i + 1;
  }

  return aggregatedData;
};
