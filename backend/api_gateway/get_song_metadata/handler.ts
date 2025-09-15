import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { getAlbumBanner } from "./utils/get_album_banner";

const DYNAMODB_CLIENT = new DynamoDBClient({});
const { SONG_HISTORY_TABLE_NAME } = process.env;

export const handler = async (event: any) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // Extract track_id from query parameters
    const trackId = event.queryStringParameters?.track_id;

    if (!trackId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "track_id is required",
        }),
      };
    }

    // Query using the track_id_index GSI
    const queryCommand = new QueryCommand({
      TableName: SONG_HISTORY_TABLE_NAME,
      IndexName: "track_id_index",
      KeyConditionExpression: "track_id = :track_id",
      ExpressionAttributeValues: {
        ":track_id": { S: trackId },
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
          error: "Song not found",
        }),
      };
    }

    // Convert DynamoDB item to regular object
    const song = result.Items[0];

    const bannerResult = await getAlbumBanner(
      song.album_id?.S!,
      song.album_cover_url?.S!
    );

    const albumBanner = bannerResult ? bannerResult.s3Url : null;
    const primaryColor = bannerResult ? bannerResult.primaryColor : null;
    const secondaryColor = bannerResult ? bannerResult.secondaryColor : null;

    const songData = {
      track_id: song.track_id?.S,
      artist_id: song.artist_id?.S,
      track_name: song.track_name?.S,
      artist_name: song.artist_name?.S,
      album_name: song.album_name?.S,
      album_id: song.album_id?.S,
      album_cover_url: song.album_cover_url?.S,
      genre: song.genre?.S,
      position: song.position?.N ? parseInt(song.position.N) : null,
      peak_position: song.peak_position?.N
        ? parseInt(song.peak_position.N)
        : null,
      weeks_on_chart: song.weeks_on_chart?.N
        ? parseInt(song.weeks_on_chart.N)
        : null,
      play_count: song.play_count?.N ? parseInt(song.play_count.N) : null,
      last_week_position: song.last_week_position?.N
        ? parseInt(song.last_week_position.N)
        : null,
      last_charted_at: song.last_charted_at?.S,
      album_cover_banner: albumBanner,
      cover_primary_color: primaryColor,
      cover_secondary_color: secondaryColor,
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(songData),
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
