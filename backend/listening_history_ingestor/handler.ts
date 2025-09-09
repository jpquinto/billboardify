import { getLastIngestionTimestamp } from "./utils/get_last_ingestion_timestamp";
import { ingestRecentListeningData } from "./utils/ingest_listening_history";
import { updateLastIngestionTimestamp } from "./utils/update_last_ingestion_timestamp";
import { writeListeningHistoryToTable } from "./utils/write_listening_history_to_table";

/**
 * Interface representing a single listening history item from Spotify.
 */
export interface ListeningHistoryItem {
  trackId: string;
  trackName: string;
  artistName: string;
  albumName: string;
  playedAt: string;
  artistId?: string;
  albumId?: string;
  albumCoverUrl?: string;
}

export const handler = async () => {
  console.log("Listening History Ingestor Triggered");

  // Step 1. Get last ingestion timestamp from DynamoDB
  let lastIngestionTimestamp: string | null = null;
  try {
    lastIngestionTimestamp = await getLastIngestionTimestamp();
  } catch (error: any) {
    console.error("Error getting last ingestion timestamp:", error);
    throw new Error(error);
  }

  if (!lastIngestionTimestamp) {
    console.log("No previous ingestion timestamp found.");
    return;
  }

  // Step 2. Get recent listening history from Spotify
  let listeningHistory: ListeningHistoryItem[] | null = null;
  try {
    listeningHistory = await ingestRecentListeningData(lastIngestionTimestamp);
  } catch (error: any) {
    console.error("Error ingesting listening history:", error);
    throw new Error(error);
  }

  if (!listeningHistory || listeningHistory.length === 0) {
    console.log("No new listening history to process.");
    return;
  }
  // Step 3. Store listening history in DynamoDB
  try {
    await writeListeningHistoryToTable(listeningHistory);
  } catch (error: any) {
    console.error("Error writing listening history to table:", error);
    throw new Error(error);
  }

  // Step 4. Update last ingestion timestamp in DynamoDB
  try {
    await updateLastIngestionTimestamp();
  } catch (error: any) {
    console.error("Error updating ingestion timestamp:", error);
    throw new Error(error);
  }
};
