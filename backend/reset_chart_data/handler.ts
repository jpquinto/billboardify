import {
  DynamoDBClient,
  ScanCommand,
  BatchWriteItemCommand,
  AttributeValue,
  ScanCommandInput,
} from "@aws-sdk/client-dynamodb";

const DYNAMODB_CLIENT = new DynamoDBClient({});

const SONG_HISTORY_TABLE_NAME = process.env.SONG_HISTORY_TABLE_NAME!;
const BATCH_SIZE = 25; // DynamoDB batch write limit

export const handler = async () => {
  console.log("Starting chart data reset for table:", SONG_HISTORY_TABLE_NAME);

  try {
    let totalItemsProcessed = 0;
    let lastEvaluatedKey: Record<string, AttributeValue> | undefined =
      undefined;

    do {
      // Scan the table in batches
      const scanParams: ScanCommandInput = {
        TableName: SONG_HISTORY_TABLE_NAME,
        ExclusiveStartKey: lastEvaluatedKey,
        Limit: 100, // Scan batch size
      };

      console.log(`Scanning batch starting from key:`, lastEvaluatedKey);
      const scanResult = await DYNAMODB_CLIENT.send(
        new ScanCommand(scanParams)
      );

      if (!scanResult.Items || scanResult.Items.length === 0) {
        break;
      }

      console.log(`Found ${scanResult.Items.length} items to process`);

      // Process items in batches for batch write
      const batches = [];
      for (let i = 0; i < scanResult.Items.length; i += BATCH_SIZE) {
        batches.push(scanResult.Items.slice(i, i + BATCH_SIZE));
      }

      // Process each batch
      for (const batch of batches) {
        const writeRequests = batch.map(
          (item: Record<string, AttributeValue>) => ({
            PutRequest: {
              Item: {
                ...item,
                last_week_position: { NULL: true },
                weeks_on_chart: { NULL: true },
                peak_position: { NULL: true },
                last_charted_at: { NULL: true },
                play_count: { N: "0" },
              },
            },
          })
        );

        const batchWriteParams = {
          RequestItems: {
            [SONG_HISTORY_TABLE_NAME]: writeRequests,
          },
        };

        console.log(`Writing batch of ${writeRequests.length} items`);
        await DYNAMODB_CLIENT.send(new BatchWriteItemCommand(batchWriteParams));

        totalItemsProcessed += writeRequests.length;
      }

      lastEvaluatedKey = scanResult.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    console.log(
      `Successfully reset chart data for ${totalItemsProcessed} items`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Chart data reset completed successfully",
        itemsProcessed: totalItemsProcessed,
      }),
    };
  } catch (error) {
    console.error("Error resetting chart data:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error resetting chart data",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
