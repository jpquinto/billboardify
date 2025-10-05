const getAccessToken = require("/opt/nodejs/get_access_token").default;

async function playTracks(
  accessToken: string,
  trackUris: string[]
): Promise<void> {
  const response = await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uris: trackUris,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to play tracks: ${error}`);
  }
}

async function addToQueue(
  accessToken: string,
  trackUri: string
): Promise<void> {
  const response = await fetch(
    `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(
      trackUri
    )}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add track to queue: ${error}`);
  }
}

export const handler = async (event: any) => {
  console.log("Playback controller tool handler invoked");
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // Parse the body if it exists
    const body = event.body ? JSON.parse(event.body) : {};
    console.log("Parsed body:", JSON.stringify(body, null, 2));

    const { track_ids, action } = body;

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

    if (action === "play_now") {
      // Play the tracks immediately (Spotify will play the first and queue the rest)
      console.log("Playing tracks immediately");
      await playTracks(accessToken, trackUris);

      console.log(`Started playback with ${trackUris.length} track(s)`);
    } else {
      // Add all tracks to queue
      console.log("Adding tracks to queue");
      for (const trackUri of trackUris) {
        await addToQueue(accessToken, trackUri);
        console.log(`Added to queue: ${trackUri}`);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        response: {
          status: "success",
          message:
            action === "play_now"
              ? `Now playing ${trackUris.length} track(s)`
              : `Added ${trackUris.length} track(s) to queue`,
          tracks_processed: trackUris.length,
        },
      }),
    };
  } catch (error: any) {
    console.error("Error in playback controller:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        response: {
          status: "error",
          message: error.message || "Failed to control playback",
        },
      }),
    };
  }
};
