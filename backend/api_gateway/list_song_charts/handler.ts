import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  S3Client,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
} from "@aws-sdk/client-s3";

const S3_CLIENT = new S3Client({});
const { SONG_CHART_HISTORY_BUCKET_NAME } = process.env;

interface ChartListItem {
  timestamp: string;
  key: string;
  lastModified?: string;
  size?: number;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // Extract optional query parameters
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit)
      : 10; // Default to 10 charts

    // Validate limit
    if (limit < 1 || limit > 1000) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Limit must be between 1 and 1000",
        }),
      };
    }

    // List objects in S3 bucket under the "me/" prefix
    const listObjectsParams: ListObjectsV2CommandInput = {
      Bucket: SONG_CHART_HISTORY_BUCKET_NAME,
      Prefix: "me/songs/",
      MaxKeys: limit,
    };

    console.log(
      `Listing charts from S3 bucket: ${SONG_CHART_HISTORY_BUCKET_NAME}`
    );

    const s3Response = await S3_CLIENT.send(
      new ListObjectsV2Command(listObjectsParams)
    );

    if (!s3Response.Contents || s3Response.Contents.length === 0) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        },
        body: JSON.stringify({
          charts: [],
          total_count: 0,
          message: "No charts found",
        }),
      };
    }

    // Process and sort the chart files
    const chartList: ChartListItem[] = s3Response.Contents.filter((obj) => {
      // Filter out non-JSON files and ensure proper format
      return (
        obj.Key &&
        obj.Key.endsWith(".json") &&
        obj.Key.match(
          /^me\/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?\.json$/
        )
      );
    })
      .map((obj) => {
        // Extract timestamp from the key (remove "me/" prefix and ".json" suffix)
        const timestamp = obj.Key!.replace(/^me\//, "").replace(/\.json$/, "");

        return {
          timestamp,
          key: obj.Key!,
          lastModified: obj.LastModified?.toISOString(),
          size: obj.Size,
        };
      })
      .sort((a, b) => {
        // Sort by timestamp in descending order (most recent first)
        return b.timestamp.localeCompare(a.timestamp);
      });

    console.log(`Successfully retrieved ${chartList.length} chart entries`);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300", // Cache for 5 minutes
      },
      body: JSON.stringify({
        charts: chartList,
        total_count: chartList.length,
        limit: limit,
        is_truncated: s3Response.IsTruncated || false,
      }),
    };
  } catch (error: any) {
    console.error("Error listing song charts:", error);

    // Handle specific S3 errors
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

    if (error.name === "NoSuchBucket" || error.Code === "NoSuchBucket") {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Chart storage bucket not found",
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
