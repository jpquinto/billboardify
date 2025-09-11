// Returns the first artist from a potentially multi-artist string

import { ArtistChartData } from "../types";

// Used only for calculations, as displaying the full artist string is preferred on frontend
export const getFirstArtist = (artistName: string): string => {
  // Special case for Tyler, The Creator
  if (artistName.startsWith("Tyler, The Creator")) {
    return "Tyler, The Creator";
  }

  // For all other cases, split by comma and take the first artist
  return artistName.split(",")[0].trim();
};

export const extractBannerUrlsMap = (
  artistChartData: ArtistChartData[]
): Map<string, string> => {
  const bannerUrlMap = new Map<string, string>();

  for (const artist of artistChartData) {
    if (artist.banner_url) {
      bannerUrlMap.set(artist.artist_id, artist.banner_url);
    }
  }

  return bannerUrlMap;
};
