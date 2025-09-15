"use server";

import { ListeningHistoryChartData } from "@/types/listening-history";
import axios from "axios";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

interface GetListeningHistoryProps {
  id: string;
  type: "song" | "album" | "artist";
  start_date: string; // ISO date string, YYYY-MM-DD
  end_date: string; // ISO date string, YYYY-MM-DD
}

export const getListeningHistory = async ({
  id,
  type,
  start_date,
  end_date,
}: GetListeningHistoryProps): Promise<ListeningHistoryChartData> => {
  try {
    const response = await axios.get(
      `${BACKEND_API_URL}/get-listening-history`,
      {
        params: {
          id,
          type,
          start_date,
          end_date,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;

    return data;
  } catch (error) {
    console.error("Error fetching listening history:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Listening history not found for id: ${id}`);
      } else if (error.response?.status === 400) {
        throw new Error(`Invalid request format`);
      } else if (error.response?.status === 403) {
        throw new Error("Access denied to listening history data data");
      } else {
        throw new Error(
          `Failed to fetch song metadata: ${
            error.response?.data?.error || error.message
          }`
        );
      }
    }

    throw new Error("Network error occurred while fetching listening history");
  }
};
