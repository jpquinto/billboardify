import {
  DynamoDBClient,
  UpdateItemCommand,
  UpdateItemCommandInput,
} from "@aws-sdk/client-dynamodb";

const DYNAMODB_CLIENT = new DynamoDBClient({});
const { ARTIST_HISTORY_TABLE_NAME } = process.env;

interface UpdateArtistBannerParams {
  artist_id: string;
  banner_url: string;
}

export const updateArtistBanner = async ({
  artist_id,
  banner_url,
}: UpdateArtistBannerParams): Promise<void> => {
  try {
    const updateParams: UpdateItemCommandInput = {
      TableName: ARTIST_HISTORY_TABLE_NAME,
      Key: {
        artist_id: { S: artist_id },
      },
      UpdateExpression: "SET banner_url = :banner_url",
      ExpressionAttributeValues: {
        ":banner_url": { S: banner_url },
      },
      ReturnValues: "NONE",
    };

    const command = new UpdateItemCommand(updateParams);
    await DYNAMODB_CLIENT.send(command);

    console.log(`✅ Updated banner for artist ${artist_id}`);
  } catch (error) {
    console.error(`❌ Failed to update banner for artist ${artist_id}:`, error);
    throw error;
  }
};

// Batch update function for multiple artists
export const updateMultipleArtistBanners = async (
  banners: Array<{ artist_id: string; banner_url: string }>
): Promise<void> => {
  const updatePromises = banners.map((banner) =>
    updateArtistBanner({
      artist_id: banner.artist_id,
      banner_url: banner.banner_url,
    })
  );

  try {
    await Promise.allSettled(updatePromises);
    console.log(`Completed banner updates for ${banners.length} artists`);
  } catch (error) {
    console.error("Error in batch banner update:", error);
    throw error;
  }
};
