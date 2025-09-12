import { CurrentAlbumChartPointData, AlbumChartData } from "../types";
import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
  GetItemCommandInput,
  UpdateItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { generateImageBanner } from "./album_banner";

const DYNAMODB_CLIENT = new DynamoDBClient({});
const { ALBUM_HISTORY_TABLE_NAME } = process.env;

// Go through each album in the current chart point data and calculate its new chart entry
export const createAlbumChartEntryAndAggregatePlayCounts = async (
  recentListeningHistory: Map<string, number>,
  chartPointData: CurrentAlbumChartPointData[],
  chartTimestamp: string
): Promise<AlbumChartData[]> => {
  // Process all albums in parallel
  const chartEntryPromises = chartPointData.map(async (entry) => {
    const recentPlayCount = recentListeningHistory.get(entry.album_id) || 0;

    // Get and update the chart entry using the position from the entry
    const chartEntry = await getAndUpdateAlbumChartEntry(
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

// Fetch existing album data, calculate new metrics, update DynamoDB, and return updated chart entry
export const getAndUpdateAlbumChartEntry = async (
  entry: CurrentAlbumChartPointData,
  position: number,
  recent_play_count: number,
  chart_timestamp: string
): Promise<AlbumChartData> => {
  // Step 1. Get album data from DynamoDB
  const getItemParams: GetItemCommandInput = {
    TableName: ALBUM_HISTORY_TABLE_NAME,
    Key: {
      album_id: { S: entry.album_id },
    },
  };

  const { Item: existingItem } = await DYNAMODB_CLIENT.send(
    new GetItemCommand(getItemParams)
  );

  let playCount = recent_play_count;
  let lastWeekPosition: number | null = null;
  let weeksOnChart = 1;
  let peakPosition = position;
  let albumCoverBanner: string | undefined = undefined;

  // Determine if this album should be marked as "charted" (position <= 50)
  const isCharted = position <= 50;

  // Check if we need a melting banner (top 20)
  const needsMeltingBanner = position <= 20;

  if (existingItem) {
    // If the album exists, calculate the new metrics
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

    // Check for existing banner
    const existingBanner = existingItem.album_cover_banner?.S;

    playCount += existingPlayCount;
    lastWeekPosition = existingCurrentPosition;
    weeksOnChart = isCharted ? existingWeeksOnChart + 1 : existingWeeksOnChart;
    peakPosition = Math.min(existingPeakPosition, position);
    albumCoverBanner = existingBanner;
  }

  if (needsMeltingBanner && !albumCoverBanner && entry.album_cover_url) {
    try {
      albumCoverBanner = await generateImageBanner(
        entry.album_id,
        entry.album_cover_url
      );
    } catch (error) {
      console.error(
        `❌ Failed to generate banner for ${entry.album_name}:`,
        error
      );
      // Continue without banner - non-critical error
    }
  }

  // Step 3. Update DynamoDB with new album data
  let updateExpression =
    "SET #play_count = :total_plays, " +
    "#peak_position = :peak_position, " +
    "#weeks_on_chart = :weeks_on_chart, " +
    "#last_charted_at = :last_charted_at, " +
    "#album_name = if_not_exists(#album_name, :album_name), " +
    "#artist_id = if_not_exists(#artist_id, :artist_id), " +
    "#artist_name = if_not_exists(#artist_name, :artist_name)";

  // Only set position if the album is in the top 50
  if (isCharted) {
    updateExpression += ", #position = :current_position";
  }

  // Only set last_week_position if we have a value for it
  if (lastWeekPosition !== null) {
    updateExpression += ", #last_week_position = :last_week_position";
  }

  if (albumCoverBanner) {
    updateExpression += ", #album_cover_banner = :album_cover_banner";
  }

  if (entry.genre) {
    updateExpression += ", #genre = if_not_exists(#genre, :genre)";
  }

  const expressionAttributeNames: Record<string, string> = {
    "#play_count": "play_count",
    "#peak_position": "peak_position",
    "#weeks_on_chart": "weeks_on_chart",
    "#last_charted_at": "last_charted_at",
    "#album_name": "album_name",
    "#artist_id": "artist_id",
    "#artist_name": "artist_name",
  };

  const expressionAttributeValues: Record<string, any> = {
    ":total_plays": { N: playCount.toString() },
    ":peak_position": { N: peakPosition.toString() },
    ":weeks_on_chart": { N: weeksOnChart.toString() },
    ":last_charted_at": { S: chart_timestamp },
    ":album_name": { S: entry.album_name },
    ":artist_id": { S: entry.artist_id },
    ":artist_name": { S: entry.artist_name },
  };

  // Only add position-related attributes if the album is in the top 50
  if (isCharted) {
    expressionAttributeNames["#position"] = "position";
    expressionAttributeValues[":current_position"] = { N: position.toString() };
  }

  if (lastWeekPosition !== null) {
    expressionAttributeNames["#last_week_position"] = "last_week_position";
    expressionAttributeValues[":last_week_position"] = {
      N: lastWeekPosition.toString(),
    };
  }

  // Add banner attributes if we have a banner
  if (albumCoverBanner) {
    expressionAttributeNames["#album_cover_banner"] = "album_cover_banner";
    expressionAttributeValues[":album_cover_banner"] = { S: albumCoverBanner };
  }

  if (entry.genre) {
    expressionAttributeNames["#genre"] = "genre";
    expressionAttributeValues[":genre"] = { S: entry.genre };
  }

  const updateItemParams: UpdateItemCommandInput = {
    TableName: ALBUM_HISTORY_TABLE_NAME,
    Key: {
      album_id: { S: entry.album_id },
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  await DYNAMODB_CLIENT.send(new UpdateItemCommand(updateItemParams));

  // Step 4. Return chart entry
  return {
    position,
    album_id: entry.album_id,
    album_name: entry.album_name,
    artist_id: entry.artist_id,
    artist_name: entry.artist_name,
    last_charted_at: chart_timestamp,
    peak: peakPosition,
    weeks_on_chart: weeksOnChart,
    last_week: lastWeekPosition,
    total_plays_since_last_week: recent_play_count,
    total_points: entry.points,
    genre: entry.genre,
    album_cover_url: entry.album_cover_url,
    album_cover_banner: albumCoverBanner,
  };
};
