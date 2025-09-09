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
  timestamp: string;
  chart: SongChartEntry[];
  totalEntries: number;
}
