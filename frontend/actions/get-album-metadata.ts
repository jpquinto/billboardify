"use server";

import { AlbumMetadata } from "@/types/album-metadata";
import axios from "axios";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

export const getAlbumMetadata = async (
  album_id: string
): Promise<AlbumMetadata> => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/get-album-metadata`, {
      params: {
        album_id: album_id,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Transform the response to match your interface
    const data = response.data;

    return data;
  } catch (error) {
    console.error("Error fetching chart:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Album metadata not found for track: ${album_id}`);
      } else if (error.response?.status === 400) {
        throw new Error(`Invalid request format: ${album_id}`);
      } else if (error.response?.status === 403) {
        throw new Error("Access denied to chart data");
      } else {
        throw new Error(
          `Failed to fetch song metadata: ${
            error.response?.data?.error || error.message
          }`
        );
      }
    }

    throw new Error("Network error occurred while fetching chart");
  }
};
