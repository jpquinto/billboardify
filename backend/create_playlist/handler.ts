const getAccessToken = require("/opt/nodejs/get_access_token").default;

async function getUserProfile(accessToken: string): Promise<string> {
  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user profile: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

async function createPlaylist(
  accessToken: string,
  userId: string,
  playlistName: string
): Promise<{ id: string; external_urls: { spotify: string } }> {
  const response = await fetch(
    `https://api.spotify.com/v1/users/${userId}/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: playlistName,
        description: "Created by your Spotify AI Assistant",
        public: false,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create playlist: ${error}`);
  }

  return await response.json();
}

async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[]
): Promise<void> {
  // Spotify API allows up to 100 tracks per request
  const batchSize = 100;

  for (let i = 0; i < trackUris.length; i += batchSize) {
    const batch = trackUris.slice(i, i + batchSize);

    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: batch,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to add tracks to playlist: ${error}`);
    }
  }
}

function generatePlaylistName(userQuery?: string): string {
  const timestamp = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (userQuery) {
    // Try to extract a meaningful name from the user query
    const lowerQuery = userQuery.toLowerCase();

    if (lowerQuery.includes("top") || lowerQuery.includes("most listened")) {
      if (lowerQuery.includes("week")) {
        return `Top Tracks - ${timestamp}`;
      } else if (lowerQuery.includes("month")) {
        return `Monthly Top Tracks - ${timestamp}`;
      } else if (lowerQuery.includes("year")) {
        return `Yearly Top Tracks - ${timestamp}`;
      }
      return `My Top Tracks - ${timestamp}`;
    }

    // Check for artist names (this is a simple heuristic)
    const artistMatch = userQuery.match(
      /(?:from|by|of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/
    );
    if (artistMatch) {
      return `${artistMatch[1]} Favorites - ${timestamp}`;
    }
  }

  return `My Playlist - ${timestamp}`;
}

export const handler = async (event: any) => {
  console.log("Create playlist handler invoked");
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // Parse the body if it exists
    const body = event.body ? JSON.parse(event.body) : {};
    console.log("Parsed body:", JSON.stringify(body, null, 2));

    const { track_ids, playlist_name, user_query } = body;

    if (!track_ids || !Array.isArray(track_ids) || track_ids.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          response: {
            status: "error",
            message: "No track IDs provided",
          },
        }),
      };
    }

    // Convert track IDs to Spotify URIs
    const trackUris = track_ids.map((id: string) => `spotify:track:${id}`);
    console.log("Track URIs:", trackUris);

    // Get access token
    const accessToken = await getAccessToken();

    // Get user ID
    console.log("Getting user profile");
    const userId = await getUserProfile(accessToken);
    console.log("User ID:", userId);

    // Generate or use provided playlist name
    const finalPlaylistName = playlist_name || generatePlaylistName(user_query);
    console.log("Creating playlist with name:", finalPlaylistName);

    // Create the playlist
    const playlist = await createPlaylist(
      accessToken,
      userId,
      finalPlaylistName
    );
    console.log("Playlist created:", playlist.id);

    // Add tracks to the playlist
    console.log(`Adding ${trackUris.length} tracks to playlist`);
    await addTracksToPlaylist(accessToken, playlist.id, trackUris);
    console.log("Tracks added successfully");

    return {
      statusCode: 200,
      body: JSON.stringify({
        response: {
          status: "success",
          message: `Created playlist "${finalPlaylistName}" with ${trackUris.length} track(s)`,
          playlist_id: playlist.id,
          playlist_url: playlist.external_urls.spotify,
          playlist_name: finalPlaylistName,
          tracks_added: trackUris.length,
        },
      }),
    };
  } catch (error: any) {
    console.error("Error in create playlist handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        response: {
          status: "error",
          message: error.message || "Failed to create playlist",
        },
      }),
    };
  }
};
