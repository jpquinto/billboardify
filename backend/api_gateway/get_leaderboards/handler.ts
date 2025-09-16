import { getLeaderboards } from "./utils/get_leaderboards";

export const handler = async (event: any) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // Extract parameters from query string
    const type = event.queryStringParameters?.type; // "song", "album", "artist"
    const granularity = event.queryStringParameters?.granularity; // "daily", "monthly", "yearly"
    const offset = parseInt(event.queryStringParameters?.offset || "0"); // pagination offset
    const start_date = event.queryStringParameters?.start_date; // YYYY-MM-DD or YYYY-MM or YYYY
    const end_date = event.queryStringParameters?.end_date; // YYYY-MM-DD or YYYY-MM or YYYY

    // Validation
    if (!type) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "type is required (song, album, or artist)",
        }),
      };
    }

    if (!granularity) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "granularity is required (daily, monthly, or yearly)",
        }),
      };
    }

    if (!start_date || !end_date) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "start_date and end_date are required",
        }),
      };
    }

    // Call the leaderboards function
    const leaderboardData = await getLeaderboards(
      type,
      granularity,
      offset,
      start_date,
      end_date
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        data: leaderboardData,
        pagination: {
          offset: offset,
          limit: 50,
          has_more: leaderboardData.length === 50, // If we got 50 results, there might be more
        },
        filters: {
          type,
          granularity,
          start_date,
          end_date,
        },
      }),
    };
  } catch (error: any) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal server error",
      }),
    };
  }
};
