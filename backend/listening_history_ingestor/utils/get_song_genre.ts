import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";

const DYNAMODB_CLIENT = new DynamoDBClient({});
const { ARTIST_HISTORY_TABLE_NAME } = process.env;

export const getSongGenre = async (
  track_id: string,
  artist_id: string,
  accessToken: string,
  foundGenres: Record<string, string>,
  foundGenresByArtist: Record<string, string>
): Promise<string | null> => {
  // Step 1: Check if genre is already in foundGenres cache (by track)
  if (foundGenres[track_id]) {
    return foundGenres[track_id];
  }

  // Step 2: Check if we already have this artist's genre in memory
  if (foundGenresByArtist[artist_id]) {
    const genre = foundGenresByArtist[artist_id];
    // Cache this result for the track too
    foundGenres[track_id] = genre;
    return genre;
  }

  console.log(
    `Genre not cached for track ${track_id} or artist ${artist_id}, checking DynamoDB...`
  );

  // Step 3: Check DynamoDB for existing genre
  const existingArtist = await checkArtistFromTable(artist_id);
  if (existingArtist?.genre) {
    // Cache at both levels
    foundGenresByArtist[artist_id] = existingArtist.genre;
    foundGenres[track_id] = existingArtist.genre;
    return existingArtist.genre;
  }

  console.log(
    `Genre not found in DynamoDB for artist ${artist_id}, querying Spotify API...`
  );

  // Step 4: Fetch from Spotify API as last resort
  const spotifyArtistData = await getArtistDataFromSpotify(
    artist_id,
    accessToken
  );
  if (spotifyArtistData?.genre) {
    // Cache at both levels
    foundGenresByArtist[artist_id] = spotifyArtistData.genre;
    foundGenres[track_id] = spotifyArtistData.genre;

    // Store in DynamoDB for future runs
    await storeArtistInTable(artist_id, spotifyArtistData, !!existingArtist);

    return spotifyArtistData.genre;
  }

  return null;
};

// Updated to return full artist data, not just genre
export const checkArtistFromTable = async (
  artist_id: string
): Promise<{
  genre?: string;
  artist_name?: string;
  artist_image_url?: string;
} | null> => {
  try {
    const command = new GetItemCommand({
      TableName: ARTIST_HISTORY_TABLE_NAME,
      Key: {
        artist_id: { S: artist_id },
      },
      ProjectionExpression: "genre, artist_name, artist_image_url",
    });

    const response = await DYNAMODB_CLIENT.send(command);

    if (response.Item) {
      return {
        genre: response.Item.genre?.S || undefined,
        artist_name: response.Item.artist_name?.S || undefined,
        artist_image_url: response.Item.artist_image_url?.S || undefined,
      };
    }

    return null;
  } catch (error) {
    console.error(
      `Error checking artist from table for artist ${artist_id}:`,
      error
    );
    return null;
  }
};

// Updated to fetch complete artist data from Spotify
export const getArtistDataFromSpotify = async (
  artist_id: string,
  accessToken: string
): Promise<{
  genre?: string;
  artist_name: string;
  artist_image_url?: string;
} | null> => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artist_id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        `Spotify API error: ${response.status} - ${await response.text()}`
      );
      return null;
    }

    const artistData = await response.json();

    return {
      genre: artistData.genres?.[0] || undefined,
      artist_name: artistData.name,
      artist_image_url: artistData.images?.[0]?.url || undefined,
    };
  } catch (error) {
    console.error(
      `Error fetching artist data from Spotify for artist ${artist_id}:`,
      error
    );
    return null;
  }
};

// Helper function to store/update artist in DynamoDB
const storeArtistInTable = async (
  artist_id: string,
  artistData: {
    genre?: string;
    artist_name: string;
    artist_image_url?: string;
  },
  artistExists: boolean
): Promise<void> => {
  try {
    let updateExpression = "SET updated_at = :updated_at";
    const expressionAttributeValues: any = {
      ":updated_at": { S: new Date().toISOString() },
    };

    // Always update genre if we have it
    if (artistData.genre) {
      updateExpression += ", genre = :genre";
      expressionAttributeValues[":genre"] = { S: artistData.genre };
    }

    // If artist doesn't exist, add name and image
    if (!artistExists) {
      updateExpression += ", artist_name = :artist_name";
      expressionAttributeValues[":artist_name"] = { S: artistData.artist_name };

      if (artistData.artist_image_url) {
        updateExpression += ", artist_image_url = :artist_image_url";
        expressionAttributeValues[":artist_image_url"] = {
          S: artistData.artist_image_url,
        };
      }
    }

    const command = new UpdateItemCommand({
      TableName: ARTIST_HISTORY_TABLE_NAME,
      Key: {
        artist_id: { S: artist_id },
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    await DYNAMODB_CLIENT.send(command);
    console.log(
      `Updated artist ${artist_id} in DynamoDB (exists: ${artistExists})`
    );
  } catch (error: any) {
    console.error(
      `Error updating artist in table for artist ${artist_id}:`,
      error
    );
  }
};

export const getSongGenreFromSpotify = async (
  artist_id: string,
  accessToken: string
): Promise<string | null> => {
  const artistData = await getArtistDataFromSpotify(artist_id, accessToken);
  return artistData?.genre || null;
};
