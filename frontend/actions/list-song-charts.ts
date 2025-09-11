"use server";

import axios from "axios";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

// Define the chart list item interface based on the API response
interface ChartListItem {
  timestamp: string;
  key: string;
  lastModified?: string;
  size?: number;
}

interface ListSongChartsResponse {
  totalCount: number;
  charts: ChartListItem[];
  isTruncated: boolean;
  limit: number;
}

interface ListSongChartsOptions {
  limit?: number;
}

export const listSongCharts = async (
  options: ListSongChartsOptions = {}
): Promise<ListSongChartsResponse> => {
  const { limit = 10 } = options;

  try {
    const response = await axios.get(`${BACKEND_API_URL}/list-song-charts`, {
      params: {
        limit,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Transform the response to match your interface
    const data = response.data;

    console.log(data.charts);

    return {
      totalCount: data.total_count,
      charts: data.charts,
      isTruncated: data.is_truncated, // Fixed typo: was "inTruncated"
      limit: data.limit,
    };
  } catch (error) {
    console.error("Error listing charts:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("Chart storage not found");
      } else if (error.response?.status === 400) {
        throw new Error(
          error.response?.data?.error || "Invalid request parameters"
        );
      } else if (error.response?.status === 403) {
        throw new Error("Access denied to chart data");
      } else {
        throw new Error(
          `Failed to list charts: ${
            error.response?.data?.error || error.message
          }`
        );
      }
    }

    throw new Error("Network error occurred while fetching charts");
  }
};
