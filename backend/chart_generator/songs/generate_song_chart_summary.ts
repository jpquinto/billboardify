import { SongChartSummary, SongChartData } from "../types";
import { getFirstArtist } from "../utils/utils";

export const generateSongChartSummary = async (
  hot100Data: SongChartData[],
  total_unique_tracks_streamed: number
): Promise<SongChartSummary> => {
  const artistCounts = new Map<
    string,
    { artist_id: string; artist_name: string; count: number }
  >();

  hot100Data.forEach((song) => {
    const firstArtistName = getFirstArtist(song.artist_name);

    const existing = artistCounts.get(song.artist_id) || {
      artist_id: song.artist_id,
      artist_name: firstArtistName,
      count: 0,
    };
    artistCounts.set(song.artist_id, {
      artist_id: song.artist_id,
      artist_name: firstArtistName,
      count: existing.count + 1,
    });
  });

  const most_charted_artists = Array.from(artistCounts.entries())
    .map(([artist_id, data]) => ({
      artist_id: data.artist_id,
      artist_name: data.artist_name,
      chart_appearances: data.count,
    }))
    .sort((a, b) => b.chart_appearances - a.chart_appearances)
    .slice(0, 10);

  // Calculate most_recently_streamed_songs (top 10 by plays_since_last_week)
  const most_recently_streamed_songs = hot100Data
    .sort((a, b) => b.plays_since_last_week - a.plays_since_last_week)
    .slice(0, 10)
    .map((song) => ({
      track_id: song.track_id,
      track_name: song.track_name,
      artist_name: song.artist_name,
      recent_plays: song.plays_since_last_week,
    }));

  // Calculate biggest_debuts (songs with weeks_on_chart === 1, sorted by position)
  const biggest_debuts = hot100Data
    .filter((song) => song.weeks_on_chart === 1)
    .sort((a, b) => a.position - b.position) // Sort by position (lower is better)
    .slice(0, 5)
    .map((song) => ({
      track_id: song.track_id,
      track_name: song.track_name,
      artist_name: song.artist_name,
      debut_position: song.position,
    }));

  // Calculate genre summary
  const genreCounts = new Map<
    string,
    { number_of_songs: number; recent_plays: number }
  >();

  hot100Data.forEach((song) => {
    if (song.genre) {
      const existing = genreCounts.get(song.genre) || {
        number_of_songs: 0,
        recent_plays: 0,
      };
      genreCounts.set(song.genre, {
        number_of_songs: existing.number_of_songs + 1,
        recent_plays: existing.recent_plays + song.plays_since_last_week,
      });
    }
  });

  const top_genres = Array.from(genreCounts.entries())
    .map(([genre, data]) => ({
      genre,
      number_of_songs: data.number_of_songs,
      recent_plays: data.recent_plays,
    }))
    .sort((a, b) => b.number_of_songs - a.number_of_songs) // Sort by number of songs
    .slice(0, 10);

  const genre_summary = {
    unique_genres: genreCounts.size,
    top_genres,
  };

  return {
    most_charted_artists,
    most_recently_streamed_songs,
    biggest_debuts,
    total_unique_tracks_streamed,
    genre_summary,
  };
};
