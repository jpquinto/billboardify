export interface AlbumMetadata {
  artist_id: string;
  artist_name: string;
  album_name: string;
  album_id: string;
  
  genre: string;
  position: number | null;
  peak_position: number | null;
  weeks_on_chart: number | null;
  play_count: number | null;
  last_week_position: number | null;
  last_charted_at: string | null;
  album_cover_banner: string | null;
  cover_primary_color: string | null;
  cover_secondary_color: string | null;
}
