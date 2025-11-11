"use server";

import { ArtistMetadata } from "@/types/artist-metadata";
import axios from "axios";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

export const getArtistMetadata = async (
  artist_id: string
): Promise<ArtistMetadata> => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/get-artist-metadata`, {
      params: {
        artist_id: artist_id,
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
        throw new Error(`Artist metadata not found for track: ${artist_id}`);
      } else if (error.response?.status === 400) {
        throw new Error(`Invalid request format: ${artist_id}`);
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
