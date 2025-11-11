import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { getAlbumBanner } from "./utils/get_album_banner";

const DYNAMODB_CLIENT = new DynamoDBClient({});
const { ALBUM_HISTORY_TABLE_NAME } = process.env;

export const handler = async (event: any) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // Extract album_id from query parameters
    const albumId = event.queryStringParameters?.album_id;

    if (!albumId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "album_id is required",
        }),
      };
    }

    const queryCommand = new QueryCommand({
      TableName: ALBUM_HISTORY_TABLE_NAME,
      KeyConditionExpression: "album_id = :album_id",
      ExpressionAttributeValues: {
        ":album_id": { S: albumId },
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
          error: "Album not found",
        }),
      };
    }

    // Convert DynamoDB item to regular object
    const album = result.Items[0];

    // Get album banner if not already stored
    let albumBanner = album.album_cover_banner?.S || null;
    let primaryColor = album.cover_primary_color?.S || null;
    let secondaryColor = album.cover_secondary_color?.S || null;

    // If banner/colors aren't stored, fetch them
    if (!albumBanner && album.album_cover_url?.S) {
      const bannerResult = await getAlbumBanner(
        album.album_id?.S!,
        album.album_cover_url.S
      );

      if (bannerResult) {
        albumBanner = bannerResult.s3Url;
        primaryColor = bannerResult.primaryColor;
        secondaryColor = bannerResult.secondaryColor;
      }
    }

    const albumData = {
      album_id: album.album_id?.S,
      album_name: album.album_name?.S,
      artist_id: album.artist_id?.S,
      artist_name: album.artist_name?.S,
      genre: album.genre?.S,
      position: album.position?.N ? parseInt(album.position.N) : null,
      peak_position: album.peak_position?.N
        ? parseInt(album.peak_position.N)
        : null,
      weeks_on_chart: album.weeks_on_chart?.N
        ? parseInt(album.weeks_on_chart.N)
        : null,
      play_count: album.play_count?.N ? parseInt(album.play_count.N) : null,
      last_week_position: album.last_week_position?.N
        ? parseInt(album.last_week_position.N)
        : null,
      last_charted_at: album.last_charted_at?.S,
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
      body: JSON.stringify(albumData),
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
