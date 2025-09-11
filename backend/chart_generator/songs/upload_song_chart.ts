import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { Banner, SongChartSummary, SongChartData } from "chart_generator/types";

const S3_CLIENT = new S3Client({});
const { SONG_CHART_HISTORY_BUCKET_NAME } = process.env;

export const uploadSongChart = async (
  chartData: SongChartData[],
  chartSummary: SongChartSummary,
  banners: Banner[],
  chartTimestamp: string
): Promise<string> => {
  const userId = "me";
  const key = `${userId}/songs/${chartTimestamp}.json`;

  const body = {
    chart_data: chartData,
    chart_summary: chartSummary,
    banners: banners,
  };

  const putObjectParams: PutObjectCommandInput = {
    Bucket: SONG_CHART_HISTORY_BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(body, null, 2),
    ContentType: "application/json",
  };

  await S3_CLIENT.send(new PutObjectCommand(putObjectParams));

  return key;
};
