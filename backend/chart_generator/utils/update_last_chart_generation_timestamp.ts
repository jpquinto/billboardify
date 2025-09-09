import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const { INGESTION_STATUS_TABLE_NAME } = process.env;

/**
 * Updates the timestamp of the last successful chart generation from the status table.
 */
export const updateLastChartGenerationTimestamp = async (
  chartTimestamp: string
): Promise<void> => {
  // Create a new DynamoDB client
  const client = new DynamoDBClient({});

  try {
    // Define the parameters for the PutItemCommand
    const params = {
      TableName: INGESTION_STATUS_TABLE_NAME,
      Item: {
        // The partition key for this specific timestamp record
        metric_name: { S: "chart_generation" },
        // The timestamp value to be stored
        timestamp: { S: chartTimestamp },
      },
    };

    // Send the PutItemCommand to DynamoDB
    const command = new PutItemCommand(params);
    await client.send(command);

    console.log(
      `Successfully updated chart generation timestamp to: ${chartTimestamp}`
    );
  } catch (error) {
    console.error("Error updating chart generation timestamp:", error);
  }
};
