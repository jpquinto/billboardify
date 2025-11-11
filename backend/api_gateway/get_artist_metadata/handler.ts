import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const DYNAMODB_CLIENT = new DynamoDBClient({});
const { ARTIST_HISTORY_TABLE_NAME } = process.env;

export const handler = async (event: any) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // Extract artist_id from query parameters
    const artistId = event.queryStringParameters?.artist_id;

    if (!artistId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "artist_id is required",
        }),
      };
    }

    const queryCommand = new QueryCommand({
      TableName: ARTIST_HISTORY_TABLE_NAME,
      KeyConditionExpression: "artist_id = :artist_id",
      ExpressionAttributeValues: {
        ":artist_id": { S: artistId },
      },
    });

    const result = await DYNAMODB_CLIENT.send(queryCommand);

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Artist not found",
        }),
      };
    }

    // Convert DynamoDB item to regular object
    const artist = result.Items[0];

    const artistData = {
      artist_id: artist.artist_id?.S,
      artist_name: artist.artist_name?.S,
      artist_image_url: artist.artist_image_url?.S,
      genre: artist.genre?.S,
      position: artist.position?.N ? parseInt(artist.position.N) : null,
      peak_position: artist.peak_position?.N
        ? parseInt(artist.peak_position.N)
        : null,
      weeks_on_chart: artist.weeks_on_chart?.N
        ? parseInt(artist.weeks_on_chart.N)
        : null,
      play_count: artist.play_count?.N ? parseInt(artist.play_count.N) : null,
      last_week_position: artist.last_week_position?.N
        ? parseInt(artist.last_week_position.N)
        : null,
      last_charted_at: artist.last_charted_at?.S,
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(artistData),
    };
  } catch (error: any) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal server error",
      }),
    };
  }
};
