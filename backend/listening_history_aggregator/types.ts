// Represents a single listening history entry stored in DynamoDB
export interface ListeningHistoryDynamoDBItem {
  user_id: "me";
  timestamp: string;
  album_name: string;
  artist_name: string;
  ingested_at: string;
  track_id: string;
  track_name: string;
  artist_id: string;
  album_id: string;
  album_cover_url: string;
  genre?: string;
  artist_image_url: string;
}

export interface DailySongAggregation {
  date: string; // e.g., "2023-10-05"
  track_id: string;
  artist_id: string;
  album_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  daily_play_count: number;
  album_cover_url: string;
}

export interface DailyArtistAggregation {
  date: string; // e.g., "2023-10-05"
  artist_id: string;
  artist_name: string;
  daily_play_count: number;
  genre?: string;
  artist_image_url: string;
}

export interface DailyAlbumAggregation {
  date: string; // e.g., "2023-10-05"
  album_id: string;
  artist_id: string;
  album_name: string;
  artist_name: string;
  daily_play_count: number;
  album_cover_url: string;
}

export interface MonthlySongAggregation {
  year_month: string; // e.g., "2023-10"
  track_id: string;
  artist_id: string;
  album_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  monthly_play_count: number;
  album_cover_url: string;
}

export interface MonthlyArtistAggregation {
  year_month: string; // e.g., "2023-10"
  artist_id: string;
  artist_name: string;
  monthly_play_count: number;
  genre?: string;
  artist_image_url: string;
}

export interface MonthlyAlbumAggregation {
  year_month: string; // e.g., "2023-10"
  album_id: string;
  artist_id: string;
  album_name: string;
  artist_name: string;
  monthly_play_count: number;
  album_cover_url: string;
}

export interface YearlySongAggregation {
  year: string; // e.g., "2023"
  track_id: string;
  artist_id: string;
  album_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  yearly_play_count: number;
  album_cover_url: string;
}

export interface YearlyArtistAggregation {
  year: string; // e.g., "2023"
  artist_id: string;
  artist_name: string;
  yearly_play_count: number;
  genre?: string;
  artist_image_url: string;
}

export interface YearlyAlbumAggregation {
  year: string; // e.g., "2023"
  album_id: string;
  artist_id: string;
  album_name: string;
  artist_name: string;
  yearly_play_count: number;
  album_cover_url: string;
}

export interface AggregationResult {
  dailySongAggregations: Record<string, DailySongAggregation>;
  dailyArtistAggregations: Record<string, DailyArtistAggregation>;
  dailyAlbumAggregations: Record<string, DailyAlbumAggregation>;
  monthlySongAggregations: Record<string, MonthlySongAggregation>;
  monthlyArtistAggregations: Record<string, MonthlyArtistAggregation>;
  monthlyAlbumAggregations: Record<string, MonthlyAlbumAggregation>;
  yearlySongAggregations: Record<string, YearlySongAggregation>;
  yearlyArtistAggregations: Record<string, YearlyArtistAggregation>;
  yearlyAlbumAggregations: Record<string, YearlyAlbumAggregation>;
}
