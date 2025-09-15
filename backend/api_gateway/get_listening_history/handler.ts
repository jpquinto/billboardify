import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ChartData } from "./types";
import { getListeningHistory } from "./utils/get_song_listening_history";

// Helper function for consistent error responses
const createErrorResponse = (
  statusCode: number,
  error: string,
  message?: string
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify({
    error,
    ...(message && { message }),
  }),
});

// Helper function for success responses
const createSuccessResponse = (data: any): APIGatewayProxyResult => ({
  statusCode: 200,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=3600",
  },
  body: JSON.stringify(data),
});

// Helper function to validate date format (YYYY-MM-DD)
const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// Helper function to validate date range
const isValidDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // Extract and validate query parameters
    const { start_date, end_date, type, id } =
      event.queryStringParameters || {};

    // Check for required parameters
    if (!type || !id || !start_date || !end_date) {
      return createErrorResponse(
        400,
        "Missing required query parameters",
        "Required: type, id, start_date, end_date"
      );
    }

    // Validate date formats
    if (!isValidDate(start_date) || !isValidDate(end_date)) {
      return createErrorResponse(
        400,
        "Invalid date format",
        "Dates must be in YYYY-MM-DD format"
      );
    }

    // Validate date range
    if (!isValidDateRange(start_date, end_date)) {
      return createErrorResponse(
        400,
        "Invalid date range",
        "start_date must be before or equal to end_date"
      );
    }

    // Optional: Validate date range isn't too large (prevent expensive queries)
    const maxDays = 365; // Adjust as needed
    const daysDiff = Math.ceil(
      (new Date(end_date).getTime() - new Date(start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysDiff > maxDays) {
      return createErrorResponse(
        400,
        "Date range too large",
        `Maximum allowed range is ${maxDays} days`
      );
    }

    let chartData: ChartData = {};

    switch (type) {
      case "song":
      case "artist":
      case "album":
        chartData = await getListeningHistory({
          type,
          id,
          start_date,
          end_date,
        });
        break;
      default:
        return createErrorResponse(
          400,
          "Invalid type parameter",
          "Supported types: song, artist, album, genre, all"
        );
    }

    return createSuccessResponse(chartData);
  } catch (error: any) {
    console.error("Error fetching listening history:", error);

    // Check for specific error types
    if (error.name === "ValidationException") {
      return createErrorResponse(400, "Invalid request", error.message);
    }

    if (error.name === "ResourceNotFoundException") {
      return createErrorResponse(
        404,
        "Resource not found",
        "The requested data could not be found"
      );
    }

    // Generic error response
    return createErrorResponse(
      500,
      "Internal server error",
      process.env.NODE_ENV === "development" ? error.message : undefined
    );
  }
};
