"use server";

import { ChatbotResponse } from "@/types/chatbot-response";
import axios from "axios";

const CHATBOT_API_URL = process.env.CHATBOT_API_URL!;

export const askQuestion = async (
  question: string,
): Promise<ChatbotResponse> => {
  try {
    const response = await axios.post(
      `${CHATBOT_API_URL}/ask-question`,
      {
        "user_query": question,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      }
    );

    const data = response.data;

    return {
      response: data.response,
      tool_data: data.tool_data || {},
    };
  } catch (error) {
    console.error("Error asking question:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return {
          success: false,
          error: "API endpoint not found. Please check the configuration.",
          statusCode: 404,
        };
      } else if (error.response?.status === 400) {
        return {
          success: false,
          error: error.response.data?.message || "Invalid question format",
          statusCode: 400,
        };
      } else if (error.response?.status === 403) {
        return {
          success: false,
          error: "Access forbidden. Please check your API credentials.",
          statusCode: 403,
        };
      } else if (error.response?.status === 429) {
        return {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
          statusCode: 429,
        };
      } else if (error.response?.status === 500) {
        return {
          success: false,
          error: "Server error occurred. Please try again later.",
          statusCode: 500,
        };
      } else {
        return {
          success: false,
          error:
            error.response?.data?.message || "An unexpected error occurred",
          statusCode: error.response?.status,
        };
      }
    }

    if (error instanceof Error && error.message.includes("timeout")) {
      return {
        success: false,
        error: "Request timed out. Please try again.",
      };
    }

    return {
      success: false,
      error: "Network error occurred while asking question",
    };
  }
};
