import { SongChartData, SongChartSummary } from "../types";

export const getArtistsForSongBanners = (
  top100Chart: SongChartData[],
  songChartSummary: SongChartSummary
): { artist_id: string; artist_name: string; chart: string }[] => {
  const artists: { artist_id: string; artist_name: string; chart: string }[] =
    [];
  artists.push({
    artist_id: top100Chart[0].artist_id,
    artist_name: top100Chart[0].artist_name,
    chart: "songs",
  });

  if (songChartSummary.most_charted_artists.length > 0) {
    // Get the ID of the artist already in the array to avoid duplication
    const existingArtistId = artists[0].artist_id;

    let addedCount = 0;
    for (const most_charted_artist of songChartSummary.most_charted_artists) {
      if (
        most_charted_artist.artist_id !== existingArtistId &&
        addedCount < 2
      ) {
        artists.push({
          artist_id: most_charted_artist.artist_id,
          artist_name: most_charted_artist.artist_name,
          chart: "songs",
        });
        addedCount++;
      }
    }
  }

  return artists;
};
