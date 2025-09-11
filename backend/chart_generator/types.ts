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

export interface CurrentChartPointData {
  position: number;
  track_id: string;
  points: number;
  track_name: string;
  artist_name: string;
  album_name: string;
  artist_id: string;
  album_id: string;
  album_cover_url: string;
}

export interface SongChartData {
  position: number;
  track_id: string;
  track_name: string;
  peak: number;
  last_week: number | null;
  weeks_on_chart: number;
  position_adjustment: string;
  artist_id: string;
  artist_name: string;
  album_id: string;
  album_name: string;
  album_cover: string;
  plays_since_last_week: number;
  points: number;
}

// Summary information about the generated song chart
export interface SongChartSummary {
  // List of the top 10 artists with the most songs on this chart
  most_charted_artists: {
    artist_id: string;
    artist_name: string;
    chart_appearances: number;
  }[];
  // List of the top 10 songs with the most recent streams on this chart (last week)
  most_recently_streamed_songs: {
    track_id: string;
    track_name: string;
    artist_name: string;
    recent_plays: number;
  }[];
  // List of the (up to) top 5 songs with the biggest debuts on this chart (first time entries)
  biggest_debuts: {
    track_id: string;
    track_name: string;
    artist_name: string;
    debut_position: number;
  }[];
  // Total number of unique tracks streamed in the last week
  total_unique_tracks_streamed: number;
}

// Represents a single artist entry in the artist chart
export interface ArtistChartData {
  position: number;
  artist_id: string;
  artist_name: string;
  peak: number;
  last_week: number | null;
  weeks_on_chart: number;
  position_adjustment: string;
  total_plays_since_last_week: number;
  total_points: number;
  artist_image_url: string | null;
}

// Represents a single artist banner image
export interface Banner {
  banner_url: string;
  artist_name: string;
}
