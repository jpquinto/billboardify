import { CurrentSongChartPointData, SongChartData } from "../types";
import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
  GetItemCommandInput,
  UpdateItemCommandInput,
} from "@aws-sdk/client-dynamodb";

const DYNAMODB_CLIENT = new DynamoDBClient({});
const { SONG_HISTORY_TABLE_NAME } = process.env;

// Go through each song in the current chart point data and calculate its new chart entry
export const createSongChartEntryAndAggregatePlayCounts = async (
  recentListeningHistory: Map<string, number>,
  chartPointData: CurrentSongChartPointData[],
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

  // Sort the chart entries by position before returning
  chartEntries.sort((a, b) => a.position - b.position);

  return chartEntries;
};

// Fetch existing song data, calculate new metrics, update DynamoDB, and return updated chart entry
export const getAndUpdateChartEntry = async (
  entry: CurrentSongChartPointData,
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

  if (existingItem) {
    // If the song exists, calculate the new metrics
    const existingPlayCount = existingItem.play_count?.N
      ? parseInt(existingItem.play_count.N)
      : 0;
    // Get the current position from database - this becomes last week's position
    const existingCurrentPosition = existingItem.position?.N
      ? parseInt(existingItem.position.N)
      : null;
    const existingWeeksOnChart = existingItem.weeks_on_chart?.N
      ? parseInt(existingItem.weeks_on_chart.N)
      : 0;
    const existingPeakPosition = existingItem.peak_position?.N
      ? parseInt(existingItem.peak_position.N)
      : position;

    playCount += existingPlayCount;
    lastWeekPosition = existingCurrentPosition;
    weeksOnChart = existingWeeksOnChart + 1;
    peakPosition = Math.min(existingPeakPosition, position);
  }

  // Determine if this song should be marked as "charted" (position <= 100)
  const isCharted = position <= 100;

  // Step 3. Update DynamoDB with new song data
  let updateExpression =
    "SET #play_count = :total_plays, " +
    "#peak_position = :peak_position, " +
    "#weeks_on_chart = :weeks_on_chart, " +
    "#last_charted_at = :last_charted_at, " +
    "#track_name = if_not_exists(#track_name, :track_name), " +
    "#artist_name = if_not_exists(#artist_name, :artist_name), " +
    "#album_name = if_not_exists(#album_name, :album_name), " +
    "#album_cover_url = if_not_exists(#album_cover_url, :album_cover_url)";

  // Only set position if the song is in the top 100
  if (isCharted) {
    updateExpression += ", #position = :current_position";
  }

  if (entry.album_id) {
    updateExpression += ", #album_id = if_not_exists(#album_id, :album_id)";
  }

  // Only set last_week_position if we have a value for it
  if (lastWeekPosition !== null) {
    updateExpression += ", #last_week_position = :last_week_position";
  }

  if (entry.genre) {
    updateExpression += ", #genre = if_not_exists(#genre, :genre)";
  }

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

  // Only add position-related attributes if the song is in the top 100
  if (isCharted) {
    expressionAttributeNames["#position"] = "position";
    expressionAttributeValues[":current_position"] = { N: position.toString() };
  }

  if (entry.album_id) {
    expressionAttributeNames["#album_id"] = "album_id";
    expressionAttributeValues[":album_id"] = { S: entry.album_id };
  }

  if (lastWeekPosition !== null) {
    expressionAttributeNames["#last_week_position"] = "last_week_position";
    expressionAttributeValues[":last_week_position"] = {
      N: lastWeekPosition.toString(),
    };
  }

  if (entry.genre) {
    expressionAttributeNames["#genre"] = "genre";
    expressionAttributeValues[":genre"] = { S: entry.genre };
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

  await DYNAMODB_CLIENT.send(new UpdateItemCommand(updateItemParams));

  // Step 4. Return chart entry
  return {
    position: position,
    track_id: entry.track_id,
    track_name: entry.track_name,
    peak: peakPosition,
    last_week: lastWeekPosition,
    weeks_on_chart: weeksOnChart,
    artist_name: entry.artist_name,
    artist_id: entry.artist_id,
    album_id: entry.album_id,
    album_name: entry.album_name,
    album_cover: entry.album_cover_url,
    plays_since_last_week: recent_play_count,
    points: entry.points,
    genre: entry.genre,
  };
};
