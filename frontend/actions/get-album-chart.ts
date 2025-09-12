"use server";

import { AlbumChart } from "@/types/chart-data";
import axios from "axios";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

export const getAlbumChart = async (timestamp: string): Promise<AlbumChart> => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/get-chart`, {
      params: {
        timestamp: timestamp,
        type: "albums",
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = response.data;

    return {
      timestamp: data.timestamp,
      chartData: data.chart.chart_data,
    };
  } catch (error) {
    console.error("Error fetching chart:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Chart not found for timestamp: ${timestamp}`);
      } else if (error.response?.status === 400) {
        throw new Error(`Invalid timestamp format: ${timestamp}`);
      } else if (error.response?.status === 403) {
        throw new Error("Access denied to chart data");
      } else {
        throw new Error(
          `Failed to fetch chart: ${
            error.response?.data?.error || error.message
          }`
        );
      }
    }

    throw new Error("Network error occurred while fetching chart");
  }
};
