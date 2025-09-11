import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const getAccessToken = require("/opt/nodejs/get_access_token").default;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    const accessToken = await getAccessToken();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        accessToken,
      }),
    };
  } catch (error: any) {
    console.error("Error getting access token:", error);

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
