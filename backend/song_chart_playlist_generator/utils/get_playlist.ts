const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

/**
 * Search for a playlist by name in the current user's playlists
 * @param playlistName - Name of the playlist to search for
 * @returns The playlist ID if found, null otherwise
 */
export const getPlaylist = async (
  playlistName: string,
  accessToken: string
): Promise<string | null> => {
  console.log(`Fetching playlist: ${playlistName}`);

  try {
    // Get current user's playlists (with pagination)
    let nextUrl = `${SPOTIFY_API_BASE}/me/playlists?limit=50`;

    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch playlists: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Search for playlist by name (case-insensitive)
      const existingPlaylist = data.items.find(
        (playlist: any) =>
          playlist.name.toLowerCase() === playlistName.toLowerCase()
      );

      if (existingPlaylist) {
        console.log(
          `Playlist "${playlistName}" found with ID: ${existingPlaylist.id}`
        );
        return existingPlaylist.id;
      }

      nextUrl = data.next;
    }

    console.log(`Playlist "${playlistName}" not found`);
    return null;
  } catch (error) {
    console.error("Error fetching playlist:", error);
    throw error;
  }
};

/**
 * Create a new playlist for the current user
 * @param playlistName - Name of the new playlist
 * @returns The created playlist ID
 */
export const createPlaylist = async (
  playlistName: string,
  accessToken: string
): Promise<string> => {
  console.log(`Creating playlist: ${playlistName}`);

  try {
    // First, get the current user's ID
    const userResponse = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!userResponse.ok) {
      throw new Error(
        `Failed to get user info: ${userResponse.status} ${userResponse.statusText}`
      );
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    // Create the playlist
    const createResponse = await fetch(
      `${SPOTIFY_API_BASE}/users/${userId}/playlists`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: playlistName,
          description: "My Current Hot 100 Playlist!",
          public: false,
        }),
      }
    );

    if (!createResponse.ok) {
      throw new Error(
        `Failed to create playlist: ${createResponse.status} ${createResponse.statusText}`
      );
    }

    const newPlaylist = await createResponse.json();
    console.log(
      `Playlist "${playlistName}" created successfully with ID: ${newPlaylist.id}`
    );
    return newPlaylist.id;
  } catch (error) {
    console.error("Error creating playlist:", error);
    throw error;
  }
};

/**
 * Get or create a playlist - checks if playlist exists, creates it if not
 * @param playlistName - Name of the playlist
 * @returns The playlist ID
 */
export const getOrCreatePlaylist = async (
  playlistName: string,
  accessToken: string
): Promise<string> => {
  try {
    // First try to get existing playlist
    let playlistId = await getPlaylist(playlistName, accessToken);

    // If not found, create it
    if (!playlistId) {
      playlistId = await createPlaylist(playlistName, accessToken);
    }

    return playlistId;
  } catch (error) {
    console.error("Error in getOrCreatePlaylist:", error);
    throw error;
  }
};
