import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ChartData } from "../types";

const client = new DynamoDBClient({});
const { LISTENING_HISTORY_TABLE_NAME } = process.env;

// Define supported types
type AnalyticsType = "song" | "artist" | "album";

interface GetListeningHistoryProps {
  type: AnalyticsType;
  id: string;
  start_date: string;
  end_date: string;
}

// Configuration mapping for each type
const typeConfig = {
  song: {
    indexName: "track_id_timestamp_index",
    attributeName: "track_id",
  },
  artist: {
    indexName: "artist_id_timestamp_index",
    attributeName: "artist_id",
  },
  album: {
    indexName: "album_id_timestamp_index",
    attributeName: "album_id",
  },
} as const;

export const getListeningHistory = async ({
  type,
  id,
  start_date,
  end_date,
}: GetListeningHistoryProps): Promise<ChartData> => {
  // Validate type
  if (!typeConfig[type]) {
    throw new Error(
      `Unsupported analytics type: ${type}. Supported types: ${Object.keys(
        typeConfig
      ).join(", ")}`
    );
  }

  const config = typeConfig[type];

  const params = {
    TableName: LISTENING_HISTORY_TABLE_NAME,
    IndexName: config.indexName,
    KeyConditionExpression: `${config.attributeName} = :id AND #ts BETWEEN :start_date AND :end_date`,
    ExpressionAttributeNames: {
      "#ts": "timestamp",
    },
    ExpressionAttributeValues: {
      ":id": { S: id },
      ":start_date": { S: start_date },
      ":end_date": { S: end_date },
    },
  };

  try {
    const command = new QueryCommand(params);
    const response = await client.send(command);

    // Process the results into chart-ready format
    const chartData: ChartData = {};

    if (response.Items) {
      response.Items.forEach((item) => {
        const unmarshalled = unmarshall(item);
        const timestamp = unmarshalled.timestamp;

        // Extract date from timestamp (assuming ISO format like "2024-01-15T10:30:00Z")
        const date = timestamp.split("T")[0]; // Gets "2024-01-15"

        // Increment count for this date
        chartData[date] = (chartData[date] || 0) + 1;
      });
    }

    // Fill in missing dates with 0 counts
    const filledChartData = fillMissingDates(chartData, start_date, end_date);

    return filledChartData;
  } catch (error) {
    console.error(`Error fetching ${type} listening history:`, error);
    throw new Error(
      `Failed to fetch ${type} listening history: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

const fillMissingDates = (
  data: ChartData,
  startDate: string,
  endDate: string
): ChartData => {
  const result: ChartData = { ...data };
  const start = new Date(startDate);
  const end = new Date(endDate);

  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split("T")[0];
    if (!(dateStr in result)) {
      result[dateStr] = 0;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Sort the dates for consistent ordering
  const sortedResult: ChartData = {};
  Object.keys(result)
    .sort()
    .forEach((date) => {
      sortedResult[date] = result[date];
    });

  return sortedResult;
};
