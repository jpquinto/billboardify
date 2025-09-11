import { ListeningHistoryDynamoDBItem } from "../types";

// Aggregate listening history to count plays for each song since the last chart generation
// This does not calculate points, just raw play counts since the last chart generation
export const aggregateSongListeningHistory = (
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
