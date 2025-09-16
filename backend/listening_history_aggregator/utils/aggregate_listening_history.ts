import { AggregationResult, ListeningHistoryDynamoDBItem } from "../types";

export const aggregateListeningHistory = (
  listeningHistory: ListeningHistoryDynamoDBItem[]
): AggregationResult => {
  const result: AggregationResult = {
    dailySongAggregations: {},
    dailyArtistAggregations: {},
    dailyAlbumAggregations: {},
    monthlySongAggregations: {},
    monthlyArtistAggregations: {},
    monthlyAlbumAggregations: {},
    yearlySongAggregations: {},
    yearlyArtistAggregations: {},
    yearlyAlbumAggregations: {},
  };

  listeningHistory.forEach((item) => {
    const playedAt = new Date(item.timestamp);

    // Extract date components
    const date = playedAt.toISOString().split("T")[0]; // "2023-10-05"
    const yearMonth = `${playedAt.getFullYear()}-${String(
      playedAt.getMonth() + 1
    ).padStart(2, "0")}`; // "2023-10"
    const year = playedAt.getFullYear().toString(); // "2023"

    // Daily Song Aggregation - key by date AND track_id
    const dailySongKey = `${date}-${item.track_id}`;
    if (!result.dailySongAggregations[dailySongKey]) {
      result.dailySongAggregations[dailySongKey] = {
        date,
        track_id: item.track_id,
        artist_id: item.artist_id,
        album_id: item.album_id,
        track_name: item.track_name,
        artist_name: item.artist_name,
        album_name: item.album_name,
        daily_play_count: 0,
      };
    }
    result.dailySongAggregations[dailySongKey].daily_play_count++;

    // Daily Artist Aggregation - key by date AND artist_id
    const dailyArtistKey = `${date}-${item.artist_id}`;
    if (!result.dailyArtistAggregations[dailyArtistKey]) {
      result.dailyArtistAggregations[dailyArtistKey] = {
        date,
        artist_id: item.artist_id,
        artist_name: item.artist_name,
        daily_play_count: 0,
        genre: item.genre,
      };
    }
    result.dailyArtistAggregations[dailyArtistKey].daily_play_count++;

    // Daily Album Aggregation - key by date AND album_id
    const dailyAlbumKey = `${date}-${item.album_id}`;
    if (!result.dailyAlbumAggregations[dailyAlbumKey]) {
      result.dailyAlbumAggregations[dailyAlbumKey] = {
        date,
        album_id: item.album_id,
        artist_id: item.artist_id,
        album_name: item.album_name,
        artist_name: item.artist_name,
        daily_play_count: 0,
      };
    }
    result.dailyAlbumAggregations[dailyAlbumKey].daily_play_count++;

    // Monthly Song Aggregation - key by year_month AND track_id
    const monthlySongKey = `${yearMonth}-${item.track_id}`;
    if (!result.monthlySongAggregations[monthlySongKey]) {
      result.monthlySongAggregations[monthlySongKey] = {
        year_month: yearMonth,
        track_id: item.track_id,
        artist_id: item.artist_id,
        album_id: item.album_id,
        track_name: item.track_name,
        artist_name: item.artist_name,
        album_name: item.album_name,
        monthly_play_count: 0,
      };
    }
    result.monthlySongAggregations[monthlySongKey].monthly_play_count++;

    // Monthly Artist Aggregation - key by year_month AND artist_id
    const monthlyArtistKey = `${yearMonth}-${item.artist_id}`;
    if (!result.monthlyArtistAggregations[monthlyArtistKey]) {
      result.monthlyArtistAggregations[monthlyArtistKey] = {
        year_month: yearMonth,
        artist_id: item.artist_id,
        artist_name: item.artist_name,
        monthly_play_count: 0,
        genre: item.genre,
      };
    }
    result.monthlyArtistAggregations[monthlyArtistKey].monthly_play_count++;

    // Monthly Album Aggregation - key by year_month AND album_id
    const monthlyAlbumKey = `${yearMonth}-${item.album_id}`;
    if (!result.monthlyAlbumAggregations[monthlyAlbumKey]) {
      result.monthlyAlbumAggregations[monthlyAlbumKey] = {
        year_month: yearMonth,
        album_id: item.album_id,
        artist_id: item.artist_id,
        album_name: item.album_name,
        artist_name: item.artist_name,
        monthly_play_count: 0,
      };
    }
    result.monthlyAlbumAggregations[monthlyAlbumKey].monthly_play_count++;

    // Yearly Song Aggregation - key by year AND track_id
    const yearlySongKey = `${year}-${item.track_id}`;
    if (!result.yearlySongAggregations[yearlySongKey]) {
      result.yearlySongAggregations[yearlySongKey] = {
        year,
        track_id: item.track_id,
        artist_id: item.artist_id,
        album_id: item.album_id,
        track_name: item.track_name,
        artist_name: item.artist_name,
        album_name: item.album_name,
        yearly_play_count: 0,
      };
    }
    result.yearlySongAggregations[yearlySongKey].yearly_play_count++;

    // Yearly Artist Aggregation - key by year AND artist_id
    const yearlyArtistKey = `${year}-${item.artist_id}`;
    if (!result.yearlyArtistAggregations[yearlyArtistKey]) {
      result.yearlyArtistAggregations[yearlyArtistKey] = {
        year,
        artist_id: item.artist_id,
        artist_name: item.artist_name,
        yearly_play_count: 0,
        genre: item.genre,
      };
    }
    result.yearlyArtistAggregations[yearlyArtistKey].yearly_play_count++;

    // Yearly Album Aggregation - key by year AND album_id
    const yearlyAlbumKey = `${year}-${item.album_id}`;
    if (!result.yearlyAlbumAggregations[yearlyAlbumKey]) {
      result.yearlyAlbumAggregations[yearlyAlbumKey] = {
        year,
        album_id: item.album_id,
        artist_id: item.artist_id,
        album_name: item.album_name,
        artist_name: item.artist_name,
        yearly_play_count: 0,
      };
    }
    result.yearlyAlbumAggregations[yearlyAlbumKey].yearly_play_count++;
  });

  return result;
};
