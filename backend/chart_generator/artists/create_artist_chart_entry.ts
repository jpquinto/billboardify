import { CurrentArtistChartPointData, ArtistChartData } from "../types";
import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
  GetItemCommandInput,
  UpdateItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { getArtistImage } from "./get_artist_image";

const DYNAMODB_CLIENT = new DynamoDBClient({});
const { ARTIST_HISTORY_TABLE_NAME } = process.env;

// Go through each artist in the current chart point data and calculate its new chart entry
export const createArtistChartEntryAndAggregatePlayCounts = async (
  recentListeningHistory: Map<string, number>,
  chartPointData: CurrentArtistChartPointData[],
  chartTimestamp: string
): Promise<ArtistChartData[]> => {
  // Process all artists in parallel
  const chartEntryPromises = chartPointData.map(async (entry) => {
    const recentPlayCount = recentListeningHistory.get(entry.artist_id) || 0;

    // Get and update the chart entry using the position from the entry
    const chartEntry = await getAndUpdateArtistChartEntry(
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

// Fetch existing artist data, calculate new metrics, update DynamoDB, and return updated chart entry
export const getAndUpdateArtistChartEntry = async (
  entry: CurrentArtistChartPointData,
  position: number,
  recent_play_count: number,
  chart_timestamp: string
): Promise<ArtistChartData> => {
  // Step 1. Get artist data from DynamoDB
  const getItemParams: GetItemCommandInput = {
    TableName: ARTIST_HISTORY_TABLE_NAME,
    Key: {
      artist_id: { S: entry.artist_id },
    },
  };

  const { Item: existingItem } = await DYNAMODB_CLIENT.send(
    new GetItemCommand(getItemParams)
  );

  let playCount = recent_play_count;
  let lastWeekPosition: number | null = null;
  let weeksOnChart = 1;
  let peakPosition = position;
  let artistImageUrl: string | null = null;
  let artistBannerUrl: string | null = null;

  // Determine if this artist should be marked as "charted" (position <= 25)
  const isCharted = position <= 25;

  if (existingItem) {
    artistBannerUrl = existingItem.banner_url?.S || null;

    // If the artist exists, calculate the new metrics
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

    // Get existing artist image URL
    artistImageUrl = existingItem.artist_image_url?.S || null;

    playCount += existingPlayCount;
    lastWeekPosition = existingCurrentPosition;
    weeksOnChart = isCharted ? existingWeeksOnChart + 1 : existingWeeksOnChart;
    peakPosition = Math.min(existingPeakPosition, position);
  }

  // Special case: If we don't have an artist image URL, fetch it from Spotify
  if (!artistImageUrl) {
    try {
      artistImageUrl = await getArtistImage(entry.artist_id);
    } catch (error) {
      console.error(
        `Failed to fetch artist image for ${entry.artist_id}:`,
        error
      );
      artistImageUrl = null;
    }
  }

  // Step 3. Update DynamoDB with new artist data
  let updateExpression =
    "SET #play_count = :total_plays, " +
    "#peak_position = :peak_position, " +
    "#weeks_on_chart = :weeks_on_chart, " +
    "#last_charted_at = :last_charted_at, " +
    "#artist_name = if_not_exists(#artist_name, :artist_name)";

  // Only set position if the artist is in the top 25
  if (isCharted) {
    updateExpression += ", #position = :current_position";
  }

  // Set artist image URL if we have one
  if (artistImageUrl) {
    updateExpression +=
      ", #artist_image_url = if_not_exists(#artist_image_url, :artist_image_url)";
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
    "#artist_name": "artist_name",
  };

  const expressionAttributeValues: Record<string, any> = {
    ":total_plays": { N: playCount.toString() },
    ":peak_position": { N: peakPosition.toString() },
    ":weeks_on_chart": { N: weeksOnChart.toString() },
    ":last_charted_at": { S: chart_timestamp },
    ":artist_name": { S: entry.artist_name },
  };

  // Only add position-related attributes if the artist is in the top 25
  if (isCharted) {
    expressionAttributeNames["#position"] = "position";
    expressionAttributeValues[":current_position"] = { N: position.toString() };
  }

  if (artistImageUrl) {
    expressionAttributeNames["#artist_image_url"] = "artist_image_url";
    expressionAttributeValues[":artist_image_url"] = { S: artistImageUrl };
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
    TableName: ARTIST_HISTORY_TABLE_NAME,
    Key: {
      artist_id: { S: entry.artist_id },
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  await DYNAMODB_CLIENT.send(new UpdateItemCommand(updateItemParams));

  // Step 4. Return chart entry
  return {
    position,
    artist_id: entry.artist_id,
    artist_name: entry.artist_name,
    last_charted_at: chart_timestamp,
    peak: peakPosition,
    weeks_on_chart: weeksOnChart,
    last_week: lastWeekPosition,
    total_plays_since_last_week: recent_play_count,
    total_points: entry.points,
    artist_image_url: artistImageUrl,
    banner_url: artistBannerUrl,
    genre: entry.genre,
  };
};
