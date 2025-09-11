// Aggregate listening history to count plays for each artist since the last chart generation

import { ListeningHistoryDynamoDBItem } from "../types";

// This does not calculate points, just raw play counts since the last chart generation
export const aggregateArtistListeningHistory = (
  lastChartGenerationTimestamp: string,
  listeningHistory: ListeningHistoryDynamoDBItem[]
): Map<string, number> => {
  // Use a map to efficiently count plays for each artist
  const artistPlayCounts = new Map<string, number>();

  // Use a number for comparison, then format to string at the end
  const lastChartTimestampMs = Date.parse(lastChartGenerationTimestamp);

  for (const item of listeningHistory) {
    // Check if the song was played after the last chart generation
    if (Date.parse(item.timestamp) > lastChartTimestampMs) {
      const currentCount = artistPlayCounts.get(item.artist_id) || 0;
      artistPlayCounts.set(item.artist_id, currentCount + 1);
    }
  }

  return artistPlayCounts;
};
