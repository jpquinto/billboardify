export interface LeaderboardEntry {
  rank: number;
  artist_name: string;
  total_plays: number;
  artist_id: string;
}

export interface SongLeaderboardEntry extends LeaderboardEntry {
  track_id: string;
  track_name: string;
  album_id: string;
  album_name: string;
  album_cover_url: string;
}

export interface ArtistLeaderboardEntry extends LeaderboardEntry {
  artist_id: string;
  artist_image_url: string;
  genre?: string;
}

export interface AlbumLeaderboardEntry extends LeaderboardEntry {
  album_id: string;
  album_name: string;
  album_cover_url: string;
}

export interface LeaderboardPagination {
  offset: number;
  limit: number;
  has_more: boolean;
}

export interface LeaderboardSummary {
  total_streams_by_granularity: Record<string, number>;
  unique_entries: number;
}

export interface LeaderboardResponse<T> {
  pagination: LeaderboardPagination;
  data: {
    leaderboard: T[];
    summary: LeaderboardSummary;
  };
}
