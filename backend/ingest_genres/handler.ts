import {
  DynamoDBClient,
  ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { getSongGenre, getSongGenreFromSpotify } from "./get_song_genre";

const DYNAMODB_CLIENT = new DynamoDBClient({});
const { LISTENING_HISTORY_TABLE_NAME } = process.env;

// Get access token function (you'll need to import this)
const getAccessToken = require("/opt/nodejs/get_access_token").default;

export const handler = async (event: any) => {
  console.log("Starting genre backfill process...");

  try {
    // Get access token for Spotify API
    const accessToken = await getAccessToken();

    // Scan all records from the table
    const allRecords = await scanAllRecords();
    console.log(`Found ${allRecords.length} total records to process`);

    // Filter records that don't have genre
    const recordsWithoutGenre = allRecords;
    console.log(`Found ${recordsWithoutGenre.length} records without genre`);

    // Process in batches to avoid overwhelming Spotify API
    const batchSize = 20; // Adjust based on rate limits
    const foundGenres: Record<string, string> = {};
    const foundGenresByArtist: Record<string, string> = {}; // Cache by artist_id
    let processedCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < recordsWithoutGenre.length; i += batchSize) {
      const batch = recordsWithoutGenre.slice(i, i + batchSize);

      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          recordsWithoutGenre.length / batchSize
        )}`
      );

      // Process each record in the batch
      for (const record of batch) {
        try {
          let genre: string | null = null;

          genre = await getSongGenre(
            record.track_id,
            record.artist_id,
            accessToken,
            foundGenres,
            foundGenresByArtist
          );

          // Update the record if we found a genre
          if (genre) {
            await updateRecordWithGenre(record, genre);
            updatedCount++;
            console.log(
              `Updated track ${record.track_id} with genre: ${genre}`
            );
          } else {
            console.log(
              `No genre found for track ${record.track_id} (artist: ${record.artist_id})`
            );
          }

          processedCount++;
        } catch (error) {
          console.error(`Error processing record ${record.track_id}:`, error);
        }
      }

      // Longer delay between batches
      if (i + batchSize < recordsWithoutGenre.length) {
        console.log("Waiting 2 seconds before next batch...");
        await sleep(500);
      }
    }

    console.log(
      `Backfill complete! Processed: ${processedCount}, Updated: ${updatedCount}`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Genre backfill completed successfully",
        totalRecords: allRecords.length,
        recordsWithoutGenre: recordsWithoutGenre.length,
        processedCount,
        updatedCount,
      }),
    };
  } catch (error) {
    console.error("Error in genre backfill:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Genre backfill failed",
      }),
    };
  }
};

async function scanAllRecords(): Promise<any[]> {
  const records: any[] = [];
  let lastEvaluatedKey: any = undefined;

  do {
    const command = new ScanCommand({
      TableName: LISTENING_HISTORY_TABLE_NAME,
      ProjectionExpression: "user_id, #ts, track_id, artist_id, genre",
      ExpressionAttributeNames: {
        "#ts": "timestamp", // timestamp is a reserved word
      },
      ExclusiveStartKey: lastEvaluatedKey,
      Limit: 100, // Process in chunks
    });

    const response = await DYNAMODB_CLIENT.send(command);

    if (response.Items) {
      const items = response.Items.map((item) => ({
        user_id: item.user_id?.S || "",
        timestamp: item.timestamp?.S || "",
        track_id: item.track_id?.S || "",
        artist_id: item.artist_id?.S || "",
        genre: item.genre?.S || null,
      }));

      records.push(...items);
    }

    lastEvaluatedKey = response.LastEvaluatedKey;

    console.log(`Scanned ${records.length} records so far...`);
  } while (lastEvaluatedKey);

  return records;
}

async function updateRecordWithGenre(
  record: any,
  genre: string
): Promise<void> {
  const command = new UpdateItemCommand({
    TableName: LISTENING_HISTORY_TABLE_NAME,
    Key: {
      user_id: { S: record.user_id },
      timestamp: { S: record.timestamp },
    },
    UpdateExpression: "SET genre = :genre",
    ExpressionAttributeValues: {
      ":genre": { S: genre },
    },
  });

  await DYNAMODB_CLIENT.send(command);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
