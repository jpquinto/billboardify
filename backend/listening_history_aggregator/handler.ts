import { ListeningHistoryDynamoDBItem } from "./types";
import { aggregateListeningHistory } from "./utils/aggregate_listening_history";
import { fetchListeningHistory } from "./utils/fetch_listening_history";
import { getLastAggregationTimestamp } from "./utils/get_last_aggregation_timestamp";
import { updateAggregationTables } from "./utils/update_aggregation_tables";
import { updateLastAggregationTimestamp } from "./utils/update_last_aggregation_timestamp";

export const handler = async () => {
  console.log("Listening History Aggregation Handler Triggered");

  // Step 1. Get last aggregation timestamp
  let lastAggregationTimestamp: string | null = null;
  try {
    lastAggregationTimestamp = await getLastAggregationTimestamp();
  } catch (error: any) {
    console.error("Error getting last aggregation timestamp:", error);
    throw new Error(error);
  }

  if (!lastAggregationTimestamp) {
    console.log("No previous aggregation timestamp found.");
    return;
  }

  // Step 2. Get new listening history since last aggregation
  let listeningHistory: ListeningHistoryDynamoDBItem[] | null = null;
  try {
    listeningHistory = await fetchListeningHistory(lastAggregationTimestamp);
  } catch (error: any) {
    console.error("Error fetching listening history:", error);
    throw new Error(error);
  }

  // Step 3. Aggregate listening history by song, artist, album
  const aggregationResult = aggregateListeningHistory(listeningHistory);

  // Step 4. Store aggregated data
  try {
    await updateAggregationTables(aggregationResult);
  } catch (error: any) {
    console.error("Error updating aggregation tables:", error);
    throw new Error(error);
  }

  // Step 5. Update last aggregation timestamp
  const timestamp = new Date().toISOString();
  try {
    await updateLastAggregationTimestamp(timestamp);
  } catch (error: any) {
    console.error("Error updating last aggregation timestamp:", error);
    throw new Error(error);
  }
};
