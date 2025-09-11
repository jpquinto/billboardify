import {
  S3Client,
  GetObjectCommand,
  GetObjectCommandInput,
} from "@aws-sdk/client-s3";
import { SongChart } from "song_chart_playlist_generator/types";

const S3_CLIENT = new S3Client({});
const { SONG_CHART_HISTORY_BUCKET_NAME } = process.env;

export const getSongChart = async (timestamp: string): Promise<SongChart> => {
  // Construct S3 key
  const userId = "me";
  const s3Key = `${userId}/${timestamp}.json`;

  console.log(`Fetching chart from S3: ${s3Key}`);

  // Get the chart from S3
  const getObjectParams: GetObjectCommandInput = {
    Bucket: SONG_CHART_HISTORY_BUCKET_NAME,
    Key: s3Key,
  };

  const s3Response = await S3_CLIENT.send(
    new GetObjectCommand(getObjectParams)
  );

  if (!s3Response.Body) {
    throw new Error("S3 object has no body");
  }

  // Read and parse the chart data
  const chartDataString = await s3Response.Body.transformToString();
  const chartData: SongChart = JSON.parse(chartDataString);

  console.log(`Successfully retrieved chart with ${timestamp} timestamp`);

  return chartData;
};
