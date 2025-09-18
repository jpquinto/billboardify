import { getFirstArtist } from "../utils/utils";
import {
  CurrentArtistChartPointData,
  ListeningHistoryDynamoDBItem,
} from "../types";

// Calculate chart points based on listening history over the last three weeks for artists
export const calculateArtistChartPointsFromListeningHistory = (
  listeningHistory: ListeningHistoryDynamoDBItem[]
): CurrentArtistChartPointData[] => {
  const artistPoints = new Map<string, number>();
  const artistDetails = new Map<
    string,
    Omit<CurrentArtistChartPointData, "points" | "position">
  >();

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

    const currentPoints = artistPoints.get(item.artist_id) || 0;
    artistPoints.set(item.artist_id, currentPoints + points);

    // Store artist details if not already present
    if (!artistDetails.has(item.artist_id)) {
      artistDetails.set(item.artist_id, {
        artist_id: item.artist_id,
        artist_name: getFirstArtist(item.artist_name),
        genre: item.genre,
        artist_image_url: item.artist_image_url,
      });
    }
  }

  const aggregatedData: CurrentArtistChartPointData[] = [];
  for (const [artistId, points] of artistPoints.entries()) {
    const details = artistDetails.get(artistId);
    if (details) {
      aggregatedData.push({
        ...details,
        points: points,
        position: 0, // Placeholder, will be set later
      });
    }
  }

  // Sort the aggregated data in descending order by points to rank the artists
  aggregatedData.sort((a, b) => b.points - a.points);

  for (let i = 0; i < aggregatedData.length; i++) {
    aggregatedData[i].position = i + 1;
  }

  return aggregatedData;
};
