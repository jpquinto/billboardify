export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaybackState {
  is_playing: boolean;
  progress_ms: number;
  item: SpotifyTrack | null;
  device: {
    name: string;
    type: string;
    volume_percent: number;
  } | null;
}
