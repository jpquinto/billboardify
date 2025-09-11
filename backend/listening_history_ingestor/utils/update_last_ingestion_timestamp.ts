import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const { INGESTION_STATUS_TABLE_NAME } = process.env;

/**
 * Updates the timestamp of the last successful listening history ingestion from the status table.
 */
export const updateLastIngestionTimestamp = async (): Promise<void> => {
  // Create a new DynamoDB client
  const client = new DynamoDBClient({});

  try {
    // Get the current timestamp in ISO 8601 format
    const timestamp = new Date().toISOString();

    // Define the parameters for the PutItemCommand
    const params = {
      TableName: INGESTION_STATUS_TABLE_NAME,
      Item: {
        // The partition key for this specific timestamp record
        metric_name: { S: "listening_history_ingestion" },
        // The timestamp value to be stored
        timestamp: { S: timestamp },
      },
    };

    // Send the PutItemCommand to DynamoDB
    const command = new PutItemCommand(params);
    await client.send(command);

    console.log(`Successfully updated ingestion timestamp to: ${timestamp}`);
  } catch (error) {
    console.error("Error updating ingestion timestamp:", error);
  }
};
