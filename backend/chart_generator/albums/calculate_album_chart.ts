import { getFirstArtist } from "../utils/utils";
import {
  CurrentAlbumChartPointData,
  ListeningHistoryDynamoDBItem,
} from "../types";

// Calculate chart points based on listening history over the last three weeks for albums
export const calculateAlbumChartPointsFromListeningHistory = (
  listeningHistory: ListeningHistoryDynamoDBItem[]
): CurrentAlbumChartPointData[] => {
  const albumPoints = new Map<string, number>();
  const albumDetails = new Map<
    string,
    Omit<CurrentAlbumChartPointData, "points" | "position">
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

    const currentPoints = albumPoints.get(item.album_id) || 0;
    albumPoints.set(item.album_id, currentPoints + points);

    // Store album details if not already present
    if (!albumDetails.has(item.album_id)) {
      albumDetails.set(item.album_id, {
        album_id: item.album_id,
        album_name: item.album_name,
        artist_name: getFirstArtist(item.artist_name),
        album_cover_url: item.album_cover_url,
        genre: item.genre,
        artist_id: item.artist_id,
      });
    }
  }

  const aggregatedData: CurrentAlbumChartPointData[] = [];
  for (const [albumId, points] of albumPoints.entries()) {
    const details = albumDetails.get(albumId);
    if (details) {
      aggregatedData.push({
        ...details,
        points: points,
        position: 0, // Placeholder, will be set later
      });
    }
  }

  // Sort the aggregated data in descending order by points to rank the albums
  aggregatedData.sort((a, b) => b.points - a.points);

  for (let i = 0; i < aggregatedData.length; i++) {
    aggregatedData[i].position = i + 1;
  }

  return aggregatedData;
};
