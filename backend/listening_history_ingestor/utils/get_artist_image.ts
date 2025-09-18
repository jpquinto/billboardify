const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } =
  process.env;

export const getArtistImage = async (
  artist_id: string
): Promise<string | null> => {
  try {
    // Step 1: Get access token using refresh token
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: SPOTIFY_REFRESH_TOKEN!,
        }),
      }
    );

    if (!tokenResponse.ok) {
      console.error(
        "Failed to refresh Spotify access token:",
        tokenResponse.status
      );
      return null;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Get artist data from Spotify API
    const artistResponse = await fetch(
      `https://api.spotify.com/v1/artists/${artist_id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!artistResponse.ok) {
      console.error(
        `Failed to fetch artist data for ${artist_id}:`,
        artistResponse.status
      );
      return null;
    }

    const artistData = await artistResponse.json();

    // Step 3: Extract image URL (prefer the largest/first image)
    if (artistData.images && artistData.images.length > 0) {
      // Spotify typically returns images in descending order of size
      // Return the first (largest) image URL
      return artistData.images[0].url;
    }

    // No images available for this artist
    return null;
  } catch (error) {
    console.error("Error fetching artist image:", error);
    return null;
  }
};
