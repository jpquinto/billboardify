import {
  DynamoDBClient,
  BatchWriteItemCommand,
  BatchWriteItemCommandInput,
} from "@aws-sdk/client-dynamodb";

import { ListeningHistoryItem } from "listening_history_ingestor/handler";

const { RECENT_LISTENING_HISTORY_TABLE_NAME } = process.env;
const DYNAMODB_CLIENT = new DynamoDBClient({});
const BATCH_SIZE = 25; // DynamoDB BatchWriteItem limit

/**
 * Writes listening history items to the DynamoDB table in batches.
 * @param listeningHistory The array of listening history items to write.
 */
export const writeListeningHistoryToTable = async (
  listeningHistory: ListeningHistoryItem[]
): Promise<void> => {
  if (!RECENT_LISTENING_HISTORY_TABLE_NAME) {
    throw new Error("RECENT_LISTENING_HISTORY_TABLE_NAME is not set");
  }

  const ttlInSeconds = Math.floor(
    new Date().setMonth(new Date().getMonth() + 1) / 1000
  );

  // Split the listening history into chunks of 25 items or less
  const chunks = [];
  for (let i = 0; i < listeningHistory.length; i += BATCH_SIZE) {
    chunks.push(listeningHistory.slice(i, i + BATCH_SIZE));
  }

  // Process each chunk in parallel
  const writePromises = chunks.map(async (chunk) => {
    const putRequests = chunk.map((item) => ({
      PutRequest: {
        Item: {
          user_id: { S: "me" },
          timestamp: { S: item.playedAt },
          track_id: { S: item.trackId },
          track_name: { S: item.trackName },
          artist_name: { S: item.artistName },
          album_name: { S: item.albumName },
          artist_id: { S: item.artistId ?? "unknown" },
          album_id: { S: item.albumId ?? "unknown" },
          album_cover_url: { S: item.albumCoverUrl ?? "unknown" },
          ingested_at: { S: new Date().toISOString() },
          ttl: { N: ttlInSeconds.toString() },
        },
      },
    }));

    const params: BatchWriteItemCommandInput = {
      RequestItems: {
        [RECENT_LISTENING_HISTORY_TABLE_NAME]: putRequests,
      },
    };

    try {
      let result = await DYNAMODB_CLIENT.send(
        new BatchWriteItemCommand(params)
      );

      // Handle unprocessed items with a retry loop
      while (Object.keys(result.UnprocessedItems || {}).length > 0) {
        console.warn(`Retrying unprocessed items...`);
        const retryParams: BatchWriteItemCommandInput = {
          RequestItems: result.UnprocessedItems,
        };
        result = await DYNAMODB_CLIENT.send(
          new BatchWriteItemCommand(retryParams)
        );
      }
    } catch (error) {
      console.error("Error writing to DynamoDB:", error);
      throw error;
    }
  });

  await Promise.all(writePromises);
  console.log(
    `Successfully wrote ${listeningHistory.length} items to DynamoDB.`
  );
};
