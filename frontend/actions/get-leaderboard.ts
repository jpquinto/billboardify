"use server";

import { LeaderboardEntry, LeaderboardResponse } from "@/types/leaderboard";
import axios from "axios";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

export const getLeaderboard = async <T extends LeaderboardEntry>(
  type: "song" | "album" | "artist",
  granularity: "daily" | "monthly" | "yearly",
  offset: number,
  start_date: string,
  end_date: string
): Promise<LeaderboardResponse<T>> => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/get-leaderboards`, {
      params: {
        type,
        granularity,
        offset,
        start_date,
        end_date,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Transform the response to match the LeaderboardResponse interface
    const data = response.data;

    return {
      pagination: {
        offset: data.pagination?.offset || offset,
        limit: data.pagination?.limit || 50,
        has_more: data.pagination?.has_more || false,
      },
      data: {
        leaderboard: data.data?.leaderboard || data.leaderboard || [],
        summary: {
          total_streams_by_granularity:
            data.data?.summary?.total_streams_by_granularity || {},
          unique_entries: data.data?.summary?.unique_entries || 0,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching leaderboard:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Leaderboard not found for the specified parameters`);
      } else if (error.response?.status === 400) {
        throw new Error(
          `Invalid parameters: ${
            error.response?.data?.message || "Bad request"
          }`
        );
      } else if (error.response?.status === 403) {
        throw new Error("Access denied to leaderboard data");
      } else {
        throw new Error(
          `Failed to fetch leaderboard: ${
            error.response?.data?.error || error.message
          }`
        );
      }
    }

    throw new Error("Network error occurred while fetching leaderboard");
  }
};
