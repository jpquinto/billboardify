import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";

const DYNAMODB_CLIENT = new DynamoDBClient({});
const { ALBUM_HISTORY_TABLE_NAME } = process.env;
const { generateImageBanner } = require("/opt/nodejs/generate_album_banner");

export const getAlbumBanner = async (
  albumId: string,
  albumCoverUrl: string
): Promise<string | null> => {
  try {
    // Check if album already has a banner URL in DynamoDB
    const getItemCommand = new GetItemCommand({
      TableName: ALBUM_HISTORY_TABLE_NAME,
      Key: {
        album_id: { S: albumId },
      },
      ProjectionExpression: "album_cover_banner",
    });

    const result = await DYNAMODB_CLIENT.send(getItemCommand);

    // If banner URL exists, return it
    if (result.Item?.album_cover_banner?.S) {
      return result.Item.album_cover_banner.S;
    }

    // If no banner exists, generate one
    console.log(
      `No banner found for album ${albumId}, generating new banner...`
    );

    const bannerS3Key = await generateImageBanner(albumId, albumCoverUrl);

    if (!bannerS3Key) {
      console.error(`Failed to generate banner for album ${albumId}`);
      return null;
    }

    // Update DynamoDB with the new banner URL
    const updateItemCommand = new UpdateItemCommand({
      TableName: ALBUM_HISTORY_TABLE_NAME,
      Key: {
        album_id: { S: albumId },
      },
      UpdateExpression: "SET album_cover_banner = :bannerUrl",
      ExpressionAttributeValues: {
        ":bannerUrl": { S: bannerS3Key },
      },
    });

    await DYNAMODB_CLIENT.send(updateItemCommand);

    console.log(
      `Successfully generated banner for album ${albumId}: ${bannerS3Key}`
    );
    return bannerS3Key;
  } catch (error) {
    console.error(
      `Error getting/generating album banner for ${albumId}:`,
      error
    );
    return null;
  }
};
