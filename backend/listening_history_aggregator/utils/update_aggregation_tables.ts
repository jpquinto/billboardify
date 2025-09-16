import { AggregationResult } from "../types";
const { getPool } = require("/opt/nodejs/db/pool");

export const updateAggregationTables = async (
  aggregationResult: AggregationResult
): Promise<void> => {
  const pool = await getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Update all daily aggregates
    await updateDailyTrackAggregates(
      client,
      aggregationResult.dailySongAggregations
    );
    await updateDailyArtistAggregates(
      client,
      aggregationResult.dailyArtistAggregations
    );
    await updateDailyAlbumAggregates(
      client,
      aggregationResult.dailyAlbumAggregations
    );

    // Update all monthly aggregates
    await updateMonthlyTrackAggregates(
      client,
      aggregationResult.monthlySongAggregations
    );
    await updateMonthlyArtistAggregates(
      client,
      aggregationResult.monthlyArtistAggregations
    );
    await updateMonthlyAlbumAggregates(
      client,
      aggregationResult.monthlyAlbumAggregations
    );

    // Update all yearly aggregates
    await updateYearlyTrackAggregates(
      client,
      aggregationResult.yearlySongAggregations
    );
    await updateYearlyArtistAggregates(
      client,
      aggregationResult.yearlyArtistAggregations
    );
    await updateYearlyAlbumAggregates(
      client,
      aggregationResult.yearlyAlbumAggregations
    );

    await client.query("COMMIT");
    console.log("Successfully updated all aggregation tables");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating aggregation tables:", error);
    throw error;
  } finally {
    client.release();
  }
};

// Daily aggregate helpers - now with batch inserts
async function updateDailyTrackAggregates(
  client: any,
  aggregations: Record<string, any>
) {
  const values = Object.values(aggregations);
  if (values.length === 0) return;

  // Build VALUES clause for batch insert
  const valueStrings = values
    .map((_, index) => {
      const base = index * 8;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${
        base + 5
      }, $${base + 6}, $${base + 7}, $${base + 8})`;
    })
    .join(", ");

  const query = `
    INSERT INTO daily_track_aggregates (date, track_id, artist_id, album_id, track_name, artist_name, album_name, daily_play_count)
    VALUES ${valueStrings}
    ON CONFLICT (date, track_id)
    DO UPDATE SET
      daily_play_count = daily_track_aggregates.daily_play_count + EXCLUDED.daily_play_count,
      artist_id = EXCLUDED.artist_id,
      album_id = EXCLUDED.album_id,
      track_name = EXCLUDED.track_name,
      artist_name = EXCLUDED.artist_name,
      album_name = EXCLUDED.album_name
  `;

  // Flatten all parameters
  const params = values.flatMap((agg) => [
    agg.date,
    agg.track_id,
    agg.artist_id,
    agg.album_id,
    agg.track_name,
    agg.artist_name,
    agg.album_name,
    agg.daily_play_count,
  ]);

  await client.query(query, params);
}

async function updateDailyArtistAggregates(
  client: any,
  aggregations: Record<string, any>
) {
  const values = Object.values(aggregations);
  if (values.length === 0) return;

  const valueStrings = values
    .map((_, index) => {
      const base = index * 5;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${
        base + 5
      })`;
    })
    .join(", ");

  const query = `
    INSERT INTO daily_artist_aggregates (date, artist_id, artist_name, daily_play_count, genre)
    VALUES ${valueStrings}
    ON CONFLICT (date, artist_id)
    DO UPDATE SET
      daily_play_count = daily_artist_aggregates.daily_play_count + EXCLUDED.daily_play_count,
      artist_name = EXCLUDED.artist_name,
      genre = COALESCE(EXCLUDED.genre, daily_artist_aggregates.genre)
  `;

  const params = values.flatMap((agg) => [
    agg.date,
    agg.artist_id,
    agg.artist_name,
    agg.daily_play_count,
    agg.genre || null,
  ]);

  await client.query(query, params);
}

async function updateDailyAlbumAggregates(
  client: any,
  aggregations: Record<string, any>
) {
  const values = Object.values(aggregations);
  if (values.length === 0) return;

  const valueStrings = values
    .map((_, index) => {
      const base = index * 6;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${
        base + 5
      }, $${base + 6})`;
    })
    .join(", ");

  const query = `
    INSERT INTO daily_album_aggregates (date, album_id, artist_id, album_name, artist_name, daily_play_count)
    VALUES ${valueStrings}
    ON CONFLICT (date, album_id)
    DO UPDATE SET
      daily_play_count = daily_album_aggregates.daily_play_count + EXCLUDED.daily_play_count,
      artist_id = EXCLUDED.artist_id,
      album_name = EXCLUDED.album_name,
      artist_name = EXCLUDED.artist_name
  `;

  const params = values.flatMap((agg) => [
    agg.date,
    agg.album_id,
    agg.artist_id,
    agg.album_name,
    agg.artist_name,
    agg.daily_play_count,
  ]);

  await client.query(query, params);
}

// Monthly aggregate helpers
async function updateMonthlyTrackAggregates(
  client: any,
  aggregations: Record<string, any>
) {
  const values = Object.values(aggregations);
  if (values.length === 0) return;

  const valueStrings = values
    .map((_, index) => {
      const base = index * 8;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${
        base + 5
      }, $${base + 6}, $${base + 7}, $${base + 8})`;
    })
    .join(", ");

  const query = `
    INSERT INTO monthly_track_aggregates (year_month, track_id, artist_id, album_id, track_name, artist_name, album_name, monthly_play_count)
    VALUES ${valueStrings}
    ON CONFLICT (year_month, track_id)
    DO UPDATE SET
      monthly_play_count = monthly_track_aggregates.monthly_play_count + EXCLUDED.monthly_play_count,
      artist_id = EXCLUDED.artist_id,
      album_id = EXCLUDED.album_id,
      track_name = EXCLUDED.track_name,
      artist_name = EXCLUDED.artist_name,
      album_name = EXCLUDED.album_name
  `;

  const params = values.flatMap((agg) => [
    agg.year_month,
    agg.track_id,
    agg.artist_id,
    agg.album_id,
    agg.track_name,
    agg.artist_name,
    agg.album_name,
    agg.monthly_play_count,
  ]);

  await client.query(query, params);
}

async function updateMonthlyArtistAggregates(
  client: any,
  aggregations: Record<string, any>
) {
  const values = Object.values(aggregations);
  if (values.length === 0) return;

  const valueStrings = values
    .map((_, index) => {
      const base = index * 5;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${
        base + 5
      })`;
    })
    .join(", ");

  const query = `
    INSERT INTO monthly_artist_aggregates (year_month, artist_id, artist_name, monthly_play_count, genre)
    VALUES ${valueStrings}
    ON CONFLICT (year_month, artist_id)
    DO UPDATE SET
      monthly_play_count = monthly_artist_aggregates.monthly_play_count + EXCLUDED.monthly_play_count,
      artist_name = EXCLUDED.artist_name,
      genre = COALESCE(EXCLUDED.genre, monthly_artist_aggregates.genre)
  `;

  const params = values.flatMap((agg) => [
    agg.year_month,
    agg.artist_id,
    agg.artist_name,
    agg.monthly_play_count,
    agg.genre || null,
  ]);

  await client.query(query, params);
}

async function updateMonthlyAlbumAggregates(
  client: any,
  aggregations: Record<string, any>
) {
  const values = Object.values(aggregations);
  if (values.length === 0) return;

  const valueStrings = values
    .map((_, index) => {
      const base = index * 6;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${
        base + 5
      }, $${base + 6})`;
    })
    .join(", ");

  const query = `
    INSERT INTO monthly_album_aggregates (year_month, album_id, artist_id, album_name, artist_name, monthly_play_count)
    VALUES ${valueStrings}
    ON CONFLICT (year_month, album_id)
    DO UPDATE SET
      monthly_play_count = monthly_album_aggregates.monthly_play_count + EXCLUDED.monthly_play_count,
      artist_id = EXCLUDED.artist_id,
      album_name = EXCLUDED.album_name,
      artist_name = EXCLUDED.artist_name
  `;

  const params = values.flatMap((agg) => [
    agg.year_month,
    agg.album_id,
    agg.artist_id,
    agg.album_name,
    agg.artist_name,
    agg.monthly_play_count,
  ]);

  await client.query(query, params);
}

// Yearly aggregate helpers
async function updateYearlyTrackAggregates(
  client: any,
  aggregations: Record<string, any>
) {
  const values = Object.values(aggregations);
  if (values.length === 0) return;

  const valueStrings = values
    .map((_, index) => {
      const base = index * 8;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${
        base + 5
      }, $${base + 6}, $${base + 7}, $${base + 8})`;
    })
    .join(", ");

  const query = `
    INSERT INTO yearly_track_aggregates (year, track_id, artist_id, album_id, track_name, artist_name, album_name, yearly_play_count)
    VALUES ${valueStrings}
    ON CONFLICT (year, track_id)
    DO UPDATE SET
      yearly_play_count = yearly_track_aggregates.yearly_play_count + EXCLUDED.yearly_play_count,
      artist_id = EXCLUDED.artist_id,
      album_id = EXCLUDED.album_id,
      track_name = EXCLUDED.track_name,
      artist_name = EXCLUDED.artist_name,
      album_name = EXCLUDED.album_name
  `;

  const params = values.flatMap((agg) => [
    parseInt(agg.year),
    agg.track_id,
    agg.artist_id,
    agg.album_id,
    agg.track_name,
    agg.artist_name,
    agg.album_name,
    agg.yearly_play_count,
  ]);

  await client.query(query, params);
}

async function updateYearlyArtistAggregates(
  client: any,
  aggregations: Record<string, any>
) {
  const values = Object.values(aggregations);
  if (values.length === 0) return;

  const valueStrings = values
    .map((_, index) => {
      const base = index * 5;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${
        base + 5
      })`;
    })
    .join(", ");

  const query = `
    INSERT INTO yearly_artist_aggregates (year, artist_id, artist_name, yearly_play_count, genre)
    VALUES ${valueStrings}
    ON CONFLICT (year, artist_id)
    DO UPDATE SET
      yearly_play_count = yearly_artist_aggregates.yearly_play_count + EXCLUDED.yearly_play_count,
      artist_name = EXCLUDED.artist_name,
      genre = COALESCE(EXCLUDED.genre, yearly_artist_aggregates.genre)
  `;

  const params = values.flatMap((agg) => [
    parseInt(agg.year),
    agg.artist_id,
    agg.artist_name,
    agg.yearly_play_count,
    agg.genre || null,
  ]);

  await client.query(query, params);
}

async function updateYearlyAlbumAggregates(
  client: any,
  aggregations: Record<string, any>
) {
  const values = Object.values(aggregations);
  if (values.length === 0) return;

  const valueStrings = values
    .map((_, index) => {
      const base = index * 6;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${
        base + 5
      }, $${base + 6})`;
    })
    .join(", ");

  const query = `
    INSERT INTO yearly_album_aggregates (year, album_id, artist_id, album_name, artist_name, yearly_play_count)
    VALUES ${valueStrings}
    ON CONFLICT (year, album_id)
    DO UPDATE SET
      yearly_play_count = yearly_album_aggregates.yearly_play_count + EXCLUDED.yearly_play_count,
      artist_id = EXCLUDED.artist_id,
      album_name = EXCLUDED.album_name,
      artist_name = EXCLUDED.artist_name
  `;

  const params = values.flatMap((agg) => [
    parseInt(agg.year),
    agg.album_id,
    agg.artist_id,
    agg.album_name,
    agg.artist_name,
    agg.yearly_play_count,
  ]);

  await client.query(query, params);
}
