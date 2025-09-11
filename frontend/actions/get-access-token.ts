"use server";

import axios from "axios";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

export const getAccessToken = async (): Promise<string> => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/get-access-token`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Transform the response to match your interface
    const data = response.data;

    return data.accessToken;
  } catch (error) {
    console.error("Error fetching access token:", error);

    throw new Error("Network error occurred while fetching chart");
  }
};
