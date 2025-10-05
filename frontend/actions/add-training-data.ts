"use server";

import axios from "axios";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

interface AddTrainingDataProps {
  question: string;
  sql: string;
}

export const addTrainingData = async ({
  question,
  sql,
}: AddTrainingDataProps): Promise<{ message: string; question: string }> => {
  try {
    const response = await axios.post(
      `${BACKEND_API_URL}/add-training-data`,
      {
        question,
        sql,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;

    return data;
  } catch (error) {
    console.error("Error adding training data:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        throw new Error(
          `Invalid request: ${
            error.response?.data?.error || "Both question and sql are required"
          }`
        );
      } else if (error.response?.status === 403) {
        throw new Error("Access denied to add training data");
      } else if (error.response?.status === 500) {
        throw new Error(
          `Failed to add training data: ${
            error.response?.data?.message || error.message
          }`
        );
      } else {
        throw new Error(
          `Failed to add training data: ${
            error.response?.data?.error || error.message
          }`
        );
      }
    }

    throw new Error("Network error occurred while adding training data");
  }
};
