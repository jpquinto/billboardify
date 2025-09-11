export interface SongChartEntry {
  position: number;
  track_id: string;
  track_name: string;
  peak: number;
  last_week: number | null;
  weeks_on_chart: number;
  artist_name: string;
  album_name: string;
  album_cover: string;
  plays_since_last_week: number;
  points: number;
}

export interface SongChart {
  timestamp: string;
  chartData: SongChartEntry[];
  chartSummary: {
    most_charted_artists: {
      artist_id: string;
      artist_name: string;
      chart_appearances: number;
    }[];
    most_recently_streamed_songs: {
      track_id: string;
      track_name: string;
      artist_name: string;
      recent_plays: number;
    }[];
    biggest_debuts: {
      track_id: string;
      track_name: string;
      artist_name: string;
      debut_position: number;
    }[];
    total_unique_tracks_streamed: number;
  };
  banners: {
    banner_url: string;
    artist_name: string;
  }[];
}

export interface ArtistChartEntry {
  position: number;
  artist_id: string;
  artist_name: string;
  last_charted_at: string;
  peak: number;
  weeks_on_chart: number;
  last_week: number | null;
  total_plays_since_last_week: number;
  total_points: number;
  artist_image_url: string | null;
  banner_url: string | null;
}

export interface ArtistChart {
  timestamp: string;
  chartData: ArtistChartEntry[];
  banners: {
    banner_url: string;
    artist_name: string;
  }[];
}
