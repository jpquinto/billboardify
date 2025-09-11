import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  GetObjectCommandInput,
} from "@aws-sdk/client-s3";

const S3_CLIENT = new S3Client({});
const { SONG_CHART_HISTORY_BUCKET_NAME } = process.env;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // Extract timestamp from query parameters
    const timestamp = event.queryStringParameters?.timestamp;
    const chartType = event.queryStringParameters?.type || "songs"; // Default to "songs"

    if (!timestamp) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Missing required query parameter: timestamp",
        }),
      };
    }

    // Validate timestamp format (basic validation)
    if (!timestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error:
            "Invalid timestamp format. Expected ISO 8601 format (e.g., 2025-09-08T10:00:00.000Z)",
        }),
      };
    }

    // Construct S3 key
    const userId = "me";
    const s3Key = `${userId}/${chartType}/${timestamp}.json`;

    console.log(`Fetching chart from S3: ${s3Key}`);

    // Get the chart from S3
    const getObjectParams: GetObjectCommandInput = {
      Bucket: SONG_CHART_HISTORY_BUCKET_NAME,
      Key: s3Key,
    };

    const s3Response = await S3_CLIENT.send(
      new GetObjectCommand(getObjectParams)
    );

    if (!s3Response.Body) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Chart not found for the specified timestamp",
        }),
      };
    }

    // Read and parse the chart data
    const chartDataString = await s3Response.Body.transformToString();
    const chartData = JSON.parse(chartDataString);

    console.log(
      `Successfully retrieved chart with ${chartData.length} entries`
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour since charts don't change
      },
      body: JSON.stringify({
        timestamp,
        chart: chartData,
      }),
    };
  } catch (error: any) {
    console.error("Error fetching song chart:", error);

    // Handle specific S3 errors
    if (error.name === "NoSuchKey" || error.Code === "NoSuchKey") {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Chart not found for the specified timestamp",
        }),
      };
    }

    if (error.name === "AccessDenied" || error.Code === "AccessDenied") {
      return {
        statusCode: 403,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Access denied to the chart data",
        }),
      };
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      console.error("Invalid JSON in chart file:", error);
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Invalid chart data format",
        }),
      };
    }

    // Generic error response
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message || "Unknown error occurred",
      }),
    };
  }
};
