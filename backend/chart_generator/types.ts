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
}

export interface AggregatedListeningHistorySong {
  user_id: "me";
  track_id: string;
  track_name: string;
  play_count: number;
  album_name: string;
  artist_name: string;
  discovered_at: string;
  artist_id: string;
  album_id: string;
  album_cover_url: string;
  last_charted_at?: string;
  peak_position?: number;
  weeks_on_chart?: number;
  last_week_position?: number;
}
