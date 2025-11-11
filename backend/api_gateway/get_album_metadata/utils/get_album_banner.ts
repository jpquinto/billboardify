import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";

const DYNAMODB_CLIENT = new DynamoDBClient({});
const { ALBUM_HISTORY_TABLE_NAME } = process.env;
const { generateImageBanner } = require("/opt/nodejs/generate_album_banner");

interface BannerResult {
  s3Url: string;
  primaryColor: string | null;
  secondaryColor: string | null;
}

export const getAlbumBanner = async (
  albumId: string,
  albumCoverUrl: string
): Promise<BannerResult | null> => {
  try {
    // Check if album already has a banner URL in DynamoDB
    const getItemCommand = new GetItemCommand({
      TableName: ALBUM_HISTORY_TABLE_NAME,
      Key: {
        album_id: { S: albumId },
      },
      ProjectionExpression:
        "album_cover_banner, cover_primary_color, cover_secondary_color",
    });

    const result = await DYNAMODB_CLIENT.send(getItemCommand);

    // If banner URL exists, return it
    if (
      result.Item?.album_cover_banner?.S &&
      result.Item?.cover_secondary_color?.S &&
      result.Item?.cover_primary_color?.S
    ) {
      return {
        s3Url: result.Item.album_cover_banner.S,
        primaryColor: result.Item.cover_primary_color.S,
        secondaryColor: result.Item.cover_secondary_color.S,
      };
    }

    // If no banner exists, generate one
    console.log(
      `No banner found for album ${albumId}, generating new banner...`
    );

    const {
      s3Url: bannerS3Key,
      primaryColor,
      secondaryColor,
    } = await generateImageBanner(albumId, albumCoverUrl);

    if (!bannerS3Key) {
      console.error(`Failed to generate banner for album ${albumId}`);
      return null;
    }

    // Update DynamoDB with the new banner URL
    // Prepare the update expression and attribute values
    let updateExpression = "SET album_cover_banner = :bannerUrl";
    const expressionAttributeValues: Record<string, any> = {
      ":bannerUrl": { S: bannerS3Key },
    };

    // Add primary color if available
    if (primaryColor) {
      updateExpression += ", cover_primary_color = :primaryColor";
      expressionAttributeValues[":primaryColor"] = {
        S: JSON.stringify(primaryColor),
      };
    }

    // Add secondary color if available
    if (secondaryColor) {
      updateExpression += ", cover_secondary_color = :secondaryColor";
      expressionAttributeValues[":secondaryColor"] = {
        S: JSON.stringify(secondaryColor),
      };
    }

    // Update DynamoDB with the new banner URL and colors
    const updateItemCommand = new UpdateItemCommand({
      TableName: ALBUM_HISTORY_TABLE_NAME,
      Key: {
        album_id: { S: albumId },
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    await DYNAMODB_CLIENT.send(updateItemCommand);

    console.log(
      `Successfully generated banner for album ${albumId}: ${bannerS3Key}`
    );
    return { s3Url: bannerS3Key, primaryColor, secondaryColor };
  } catch (error) {
    console.error(
      `Error getting/generating album banner for ${albumId}:`,
      error
    );
    return null;
  }
};
