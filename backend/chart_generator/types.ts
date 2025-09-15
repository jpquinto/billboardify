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
}

// Represents an entry in the song history DynamoDB table
export interface AggregatedListeningHistorySong {
  user_id: "me";
  track_id: string;
  track_name: string;
  play_count: number;
  album_name: string;
  artist_name: string;
  artist_id: string;
  album_id: string;
  album_cover_url: string;
  last_charted_at?: string;
  peak_position?: number;
  weeks_on_chart?: number;
  last_week_position?: number;
  genre?: string;
}

export interface AggregatedListeningHistoryArtist {
  artist_id: string;
  artist_name: string;
  play_count: number;
  last_charted_at?: string;
  peak_position?: number;
  weeks_on_chart?: number;
  last_week_position?: number;
  artist_image_url?: string;
  banner_url?: string;
  genre?: string;
}

// Represents the calculation for a song for a specific chart week
export interface CurrentSongChartPointData {
  position: number;
  track_id: string;
  points: number;
  track_name: string;
  artist_name: string;
  album_name: string;
  artist_id: string;
  album_id: string;
  album_cover_url: string;
  genre?: string;
}

// Represents the calculation for an artist for a specific chart week
export interface CurrentArtistChartPointData {
  position: number;
  points: number;
  artist_id: string;
  artist_name: string;
  genre?: string;
}

// Represents the calculation for an album for a specific chart week
export interface CurrentAlbumChartPointData {
  position: number;
  album_id: string;
  points: number;
  album_name: string;
  artist_name: string;
  artist_id: string;
  album_cover_url: string;
  genre?: string;
}

// Represents a single song entry in the generated song chart
export interface SongChartData {
  position: number;
  track_id: string;
  track_name: string;
  peak: number;
  last_week: number | null;
  weeks_on_chart: number;
  artist_id: string;
  artist_name: string;
  album_id: string;
  album_name: string;
  album_cover: string;
  plays_since_last_week: number;
  points: number;
  genre?: string | null;
}

// Represents a single artist entry in the artist chart
export interface ArtistChartData {
  position: number;
  artist_id: string;
  artist_name: string;
  peak: number;
  last_charted_at: string;
  last_week: number | null;
  weeks_on_chart: number;
  total_plays_since_last_week: number;
  total_points: number;
  artist_image_url: string | null;
  banner_url: string | null;
  genre?: string | null;
}

// Represents a single album entry in the artist chart
export interface AlbumChartData {
  position: number;
  album_id: string;
  album_name: string;
  artist_id: string;
  artist_name: string;
  peak: number;
  last_charted_at: string;
  last_week: number | null;
  weeks_on_chart: number;
  total_plays_since_last_week: number;
  total_points: number;
  album_cover_url: string;
  genre?: string | null;
  album_cover_banner?: string | null;
  cover_primary_color?: string | null;
  cover_secondary_color?: string | null;
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
  genre_summary: {
    unique_genres: number;
    top_genres: {
      genre: string;
      number_of_songs: number;
      recent_plays: number;
    }[];
  };
}

// Represents a single artist banner image
export interface Banner {
  banner_url: string;
  artist_name: string;
  chart: string;
  artist_id: string;
}

// Represents the entire file for a song chart, including chart data, summary, and banners
export interface SongChartFile {
  chart_data: SongChartData[];
  chart_summary: SongChartSummary;
  banners: Banner[];
}

export interface ArtistChartFile {
  chart_data: ArtistChartData[];
  banners: Banner[];
}

export interface AlbumChartFile {
  chart_data: AlbumChartData[];
  banners: Banner[];
}

export type ChartFile = SongChartFile | ArtistChartFile | AlbumChartFile;
