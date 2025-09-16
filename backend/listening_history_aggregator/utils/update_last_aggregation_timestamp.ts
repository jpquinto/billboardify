import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const { AGGREGATION_STATUS_TABLE_NAME } = process.env;

/**
 * Updates the timestamp of the last successful listening history aggregation from the status table.
 */
export const updateLastAggregationTimestamp = async (
  timestamp: string
): Promise<void> => {
  // Create a new DynamoDB client
  const client = new DynamoDBClient({});

  try {
    // Define the parameters for the PutItemCommand
    const params = {
      TableName: AGGREGATION_STATUS_TABLE_NAME,
      Item: {
        // The partition key for this specific timestamp record
        metric_name: { S: "listening_history_aggregation" },
        // The timestamp value to be stored
        timestamp: { S: timestamp },
      },
    };

    // Send the PutItemCommand to DynamoDB
    const command = new PutItemCommand(params);
    await client.send(command);

    console.log(`Successfully updated aggregation timestamp to: ${timestamp}`);
  } catch (error) {
    console.error("Error updating aggregation timestamp:", error);
  }
};
