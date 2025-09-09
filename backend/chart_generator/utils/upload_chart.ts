import { SongChartData } from "./calculate_song_chart";
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";

const S3_CLIENT = new S3Client({});
const { SONG_CHART_HISTORY_BUCKET_NAME } = process.env;

export const uploadChart = async (
  chartData: SongChartData[],
  chartTimestamp: string
): Promise<string> => {
  const userId = "me";
  const key = `${userId}/${chartTimestamp}.json`;

  const putObjectParams: PutObjectCommandInput = {
    Bucket: SONG_CHART_HISTORY_BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(chartData, null, 2),
    ContentType: "application/json",
  };

  await S3_CLIENT.send(new PutObjectCommand(putObjectParams));

  return key;
};
