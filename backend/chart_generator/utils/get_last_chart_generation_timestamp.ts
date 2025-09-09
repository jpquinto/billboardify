import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const { INGESTION_STATUS_TABLE_NAME } = process.env;

/**
 * Gets the timestamp of the last successful chart generation from the status table.
 * @returns The timestamp string, or null if not found or an error occurs.
 */
export const getLastChartGenerationTimestamp = async (): Promise<
  string | null
> => {
  // Create a new DynamoDB client
  const client = new DynamoDBClient({});

  // Define the parameters for the GetCommand
  const params = {
    TableName: INGESTION_STATUS_TABLE_NAME,
    Key: {
      // The partition key for this specific timestamp record
      metric_name: { S: "chart_generation" },
    },
  };

  try {
    // Send the GetCommand to DynamoDB
    const command = new GetItemCommand(params);
    const { Item } = await client.send(command);

    // Check if the item was found and has the timestamp attribute
    if (Item && Item.timestamp && Item.timestamp.S) {
      return Item.timestamp.S;
    } else {
      // No item or timestamp found, return null
      return null;
    }
  } catch (error) {
    console.error("Error getting last chart generation timestamp:", error);
    return null;
  }
};
