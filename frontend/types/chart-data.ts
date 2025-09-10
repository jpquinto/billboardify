export interface SongChartEntry {
  position: number;
  track_id: string;
  track_name: string;
  peak: number;
  last_week: number | null;
  weeks_on_chart: number;
  position_adjustment: string;
  artist_name: string;
  album_name: string;
  album_cover: string;
  plays_since_last_week: number;
  points: number;
}

export interface SongChart {
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
  };
}
