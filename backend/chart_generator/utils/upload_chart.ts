import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { ChartFile } from "../types";

const S3_CLIENT = new S3Client({});
const { SONG_CHART_HISTORY_BUCKET_NAME } = process.env;

export const uploadChart = async (
  chartFile: ChartFile,
  key: string
): Promise<void> => {
  const body = chartFile;

  const putObjectParams: PutObjectCommandInput = {
    Bucket: SONG_CHART_HISTORY_BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(body, null, 2),
    ContentType: "application/json",
  };

  await S3_CLIENT.send(new PutObjectCommand(putObjectParams));
};
