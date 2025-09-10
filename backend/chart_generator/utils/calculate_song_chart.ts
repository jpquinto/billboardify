import { SongChartData } from "chart_generator/types";
import { CurrentChartPointData } from "./aggregate_songs";
import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
  GetItemCommandInput,
  UpdateItemCommandInput,
} from "@aws-sdk/client-dynamodb";

const DYNAMODB_CLIENT = new DynamoDBClient({});
const { SONG_HISTORY_TABLE_NAME } = process.env;

export const calculateSongChart = async (
  recentListeningHistory: Map<string, number>,
  chartPointData: CurrentChartPointData[],
  chartTimestamp: string
): Promise<SongChartData[]> => {
  // Process all songs in parallel
  const chartEntryPromises = chartPointData.map(async (entry) => {
    const recentPlayCount = recentListeningHistory.get(entry.track_id) || 0;

    // Get and update the chart entry using the position from the entry
    const chartEntry = await getAndUpdateChartEntry(
      entry,
      entry.position,
      recentPlayCount,
      chartTimestamp
    );

    return chartEntry;
  });

  // Wait for all operations to complete
  const chartEntries = await Promise.all(chartEntryPromises);

  return chartEntries;
};

export const getAndUpdateChartEntry = async (
  entry: CurrentChartPointData,
  position: number,
  recent_play_count: number,
  chart_timestamp: string
): Promise<SongChartData> => {
  // Step 1. Get song data from DynamoDB
  const getItemParams: GetItemCommandInput = {
    TableName: SONG_HISTORY_TABLE_NAME,
    Key: {
      artist_id: { S: entry.artist_id },
      track_id: { S: entry.track_id },
    },
  };

  const { Item: existingItem } = await DYNAMODB_CLIENT.send(
    new GetItemCommand(getItemParams)
  );

  let playCount = recent_play_count;
  let lastWeekPosition: number | null = null;
  let weeksOnChart = 1;
  let peakPosition = position;
  let positionAdjustment = "DEBUT";

  if (existingItem) {
    // If the song exists, calculate the new metrics
    const existingPlayCount = existingItem.play_count?.N
      ? parseInt(existingItem.play_count.N)
      : 0;
    const existingLastWeekPosition = existingItem.last_week_position?.N
      ? parseInt(existingItem.last_week_position.N)
      : null;
    const existingWeeksOnChart = existingItem.weeks_on_chart?.N
      ? parseInt(existingItem.weeks_on_chart.N)
      : 0;
    const existingPeakPosition = existingItem.peak_position?.N
      ? parseInt(existingItem.peak_position.N)
      : position;

    playCount += existingPlayCount;
    lastWeekPosition = existingLastWeekPosition;
    weeksOnChart = existingWeeksOnChart + 1;
    peakPosition = Math.min(existingPeakPosition, position);

    const adjustment = lastWeekPosition ? lastWeekPosition - position : "DEBUT";
    if (typeof adjustment === "number") {
      positionAdjustment = adjustment > 0 ? `+${adjustment}` : `${adjustment}`;
    }
  }

  // Determine if this song should be marked as "charted" (position <= 100)
  const isCharted = position <= 100;

  // Step 3. Update DynamoDB with new song data
  const updateExpression =
    "SET #play_count = :total_plays, " +
    "#peak_position = :peak_position, " +
    "#weeks_on_chart = :weeks_on_chart, " +
    "#last_charted_at = :last_charted_at, " +
    "#track_name = if_not_exists(#track_name, :track_name), " +
    "#artist_name = if_not_exists(#artist_name, :artist_name), " +
    "#album_name = if_not_exists(#album_name, :album_name), " +
    "#album_cover_url = if_not_exists(#album_cover_url, :album_cover_url)" +
    (entry.album_id
      ? ", #album_id = if_not_exists(#album_id, :album_id)"
      : "") +
    // Only set last_week_position if the song is actually charting (top 100)
    (isCharted ? ", #last_week_position = :current_position" : "");

  const expressionAttributeNames: Record<string, string> = {
    "#play_count": "play_count",
    "#peak_position": "peak_position",
    "#weeks_on_chart": "weeks_on_chart",
    "#last_charted_at": "last_charted_at",
    "#track_name": "track_name",
    "#artist_name": "artist_name",
    "#album_name": "album_name",
    "#album_cover_url": "album_cover_url",
  };

  const expressionAttributeValues: Record<string, any> = {
    ":total_plays": { N: playCount.toString() },
    ":peak_position": { N: peakPosition.toString() },
    ":weeks_on_chart": { N: weeksOnChart.toString() },
    ":last_charted_at": { S: chart_timestamp },
    ":track_name": { S: entry.track_name },
    ":artist_name": { S: entry.artist_name },
    ":album_name": { S: entry.album_name },
    ":album_cover_url": { S: entry.album_cover_url },
  };

  if (entry.album_id) {
    expressionAttributeNames["#album_id"] = "album_id";
    expressionAttributeValues[":album_id"] = { S: entry.album_id };
  }

  if (isCharted) {
    expressionAttributeNames["#last_week_position"] = "last_week_position";
    expressionAttributeValues[":current_position"] = { N: position.toString() };
  }

  const updateItemParams: UpdateItemCommandInput = {
    TableName: SONG_HISTORY_TABLE_NAME,
    Key: {
      artist_id: { S: entry.artist_id },
      track_id: { S: entry.track_id },
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  // await DYNAMODB_CLIENT.send(new UpdateItemCommand(updateItemParams));

  // Step 4. Return chart entry
  return {
    position: position,
    track_id: entry.track_id,
    track_name: entry.track_name,
    peak: peakPosition,
    last_week: lastWeekPosition,
    weeks_on_chart: weeksOnChart,
    position_adjustment: positionAdjustment,
    artist_name: entry.artist_name,
    artist_id: entry.artist_id,
    album_id: entry.album_id,
    album_name: entry.album_name,
    album_cover: entry.album_cover_url,
    plays_since_last_week: recent_play_count,
    points: entry.points,
  };
};
