import { getArtistsForSongBanners } from "../songs/get_artists_for_song_banners";
import {
  ArtistChartData,
  Banner,
  SongChartData,
  SongChartSummary,
} from "../types";
import { scrapeBanners } from "./scrape_banners";

interface ResolveBannersParams {
  top100Chart: SongChartData[];
  songChartSummary: SongChartSummary;
  artist25Chart: ArtistChartData[];
  existingBanners: Map<string, string>;
}

interface ResolveBannersResult {
  scrapedBanners: Banner[];
  songChartBanners: Banner[];
  artistChartBanners: Banner[];
}

interface ArtistWithCharts {
  artist_id: string;
  artist_name: string;
  charts: string[];
}

export const resolveBanners = async ({
  top100Chart,
  songChartSummary,
  artist25Chart,
  existingBanners,
}: ResolveBannersParams): Promise<ResolveBannersResult> => {
  let allBanners: Banner[] = [];
  let scrapedBanners: Banner[] = [];

  // Step 1: Build a map of artists and which charts they belong to
  const artistChartMap = new Map<string, ArtistWithCharts>();

  // Add song chart artists
  const songChartBannerArtists = getArtistsForSongBanners(
    top100Chart,
    songChartSummary
  );

  for (const artist of songChartBannerArtists) {
    if (artistChartMap.has(artist.artist_id)) {
      artistChartMap.get(artist.artist_id)!.charts.push("songs");
    } else {
      artistChartMap.set(artist.artist_id, {
        artist_id: artist.artist_id,
        artist_name: artist.artist_name,
        charts: ["songs"],
      });
    }
  }

  // Add artist chart artists
  const artistChartBannerArtists = artist25Chart.slice(0, 3);

  for (const artist of artistChartBannerArtists) {
    if (artistChartMap.has(artist.artist_id)) {
      artistChartMap.get(artist.artist_id)!.charts.push("artists");
    } else {
      artistChartMap.set(artist.artist_id, {
        artist_id: artist.artist_id,
        artist_name: artist.artist_name,
        charts: ["artists"],
      });
    }
  }

  // Step 2: Process existing banners - create banner objects for each chart the artist belongs to
  for (const [artistId, artistInfo] of artistChartMap) {
    if (existingBanners.has(artistId)) {
      const bannerUrl = existingBanners.get(artistId)!;

      // Create a banner object for each chart this artist belongs to
      for (const chart of artistInfo.charts) {
        allBanners.push({
          artist_id: artistId,
          artist_name: artistInfo.artist_name,
          banner_url: bannerUrl,
          chart: chart,
        });
      }
    }
  }

  // Step 3: Determine how many more banners we need for each chart
  const existingSongBanners = allBanners.filter(
    (b) => b.chart === "songs"
  ).length;
  const existingArtistBanners = allBanners.filter(
    (b) => b.chart === "artists"
  ).length;

  const songBannersNeeded = Math.max(0, 3 - existingSongBanners);
  const artistBannersNeeded = Math.max(0, 3 - existingArtistBanners);

  // Step 4: Identify artists that need to be scraped
  const artistsNeedingScraping = Array.from(artistChartMap.values()).filter(
    (artist) => !existingBanners.has(artist.artist_id)
  );

  // Prioritize artists by chart needs
  const songArtistsToScrape = artistsNeedingScraping
    .filter((artist) => artist.charts.includes("songs"))
    .slice(0, songBannersNeeded);

  const artistChartArtistsToScrape = artistsNeedingScraping
    .filter((artist) => artist.charts.includes("artists"))
    .slice(0, artistBannersNeeded);

  // Combine and deduplicate artists to scrape
  const uniqueArtistsToScrape = new Map<string, ArtistWithCharts>();

  for (const artist of [
    ...songArtistsToScrape,
    ...artistChartArtistsToScrape,
  ]) {
    uniqueArtistsToScrape.set(artist.artist_id, artist);
  }

  // Step 5: Scrape banners if needed
  if (uniqueArtistsToScrape.size > 0) {
    const artistsForScraping = Array.from(uniqueArtistsToScrape.values()).map(
      (artist) => ({
        artist_id: artist.artist_id,
        artist_name: artist.artist_name,
        chart: artist.charts[0], // Use first chart for scraping (doesn't matter which)
      })
    );

    scrapedBanners = await scrapeBanners({ artists: artistsForScraping });

    // Create banner objects for each chart the scraped artist belongs to
    for (const scrapedBanner of scrapedBanners) {
      const artistInfo = uniqueArtistsToScrape.get(scrapedBanner.artist_id);
      if (artistInfo) {
        for (const chart of artistInfo.charts) {
          allBanners.push({
            artist_id: scrapedBanner.artist_id,
            artist_name: scrapedBanner.artist_name,
            banner_url: scrapedBanner.banner_url,
            chart: chart,
          });
        }
      }
    }
  }

  // Step 6: Derive chart-specific banners from all banners
  const songChartBanners = allBanners
    .filter((b) => b.chart === "songs")
    .slice(0, 3);
  const artistChartBanners = allBanners
    .filter((b) => b.chart === "artists")
    .slice(0, 3);

  console.log(
    `Found ${songChartBanners.length} song chart banners and ${artistChartBanners.length} artist chart banners`
  );
  console.log(
    `Scraped ${scrapedBanners.length} new banners for database storage`
  );

  console.log("Song Chart Banners:", songChartBanners);
  console.log("Artist Chart Banners:", artistChartBanners);

  return {
    scrapedBanners,
    songChartBanners,
    artistChartBanners,
  };
};
