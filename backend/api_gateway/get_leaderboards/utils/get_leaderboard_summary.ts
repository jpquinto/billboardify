interface LeaderboardSummary {
  total_streams_by_granularity: Record<string, number>;
  unique_entries: number;
}

export async function getLeaderboardSummary(
  client: any,
  type: "song" | "artist" | "album",
  granularity: string,
  start_date: string,
  end_date: string
): Promise<LeaderboardSummary> {
  let total_streams_by_granularity: Record<string, number> = {};

  // Get streams by granularity
  if (granularity === "daily") {
    total_streams_by_granularity = await getLeaderboardDailySummary(
      client,
      start_date,
      end_date
    );
  } else if (granularity === "monthly") {
    total_streams_by_granularity = await getLeaderboardMonthlySummary(
      client,
      start_date,
      end_date
    );
  } else if (granularity === "yearly") {
    total_streams_by_granularity = await getLeaderboardYearlySummary(
      client,
      start_date,
      end_date
    );
  } else {
    throw new Error(`Unsupported granularity: ${granularity}`);
  }

  // Get unique entries count
  const unique_entries = await getUniqueEntries(
    client,
    type,
    start_date,
    end_date
  );

  return {
    total_streams_by_granularity,
    unique_entries,
  };
}

async function getLeaderboardDailySummary(
  client: any,
  start_date: string,
  end_date: string
): Promise<Record<string, number>> {
  const query = `
    SELECT 
      date,
      SUM(daily_play_count) as total_streams
    FROM daily_track_aggregates 
    WHERE date >= $1 AND date <= $2
    GROUP BY date
    ORDER BY date
  `;

  const result = await client.query(query, [start_date, end_date]);

  const summary: Record<string, number> = {};
  result.rows.forEach((row: any) => {
    // Format date as YYYY-MM-DD string
    const dateStr =
      row.date instanceof Date
        ? row.date.toISOString().split("T")[0]
        : row.date;
    summary[dateStr] = parseInt(row.total_streams);
  });

  return summary;
}

async function getLeaderboardMonthlySummary(
  client: any,
  start_date: string,
  end_date: string
): Promise<Record<string, number>> {
  // Convert dates to year-month format for comparison
  const startYearMonth = start_date.substring(0, 7); // YYYY-MM
  const endYearMonth = end_date.substring(0, 7); // YYYY-MM

  const query = `
    SELECT 
      year_month,
      SUM(monthly_play_count) as total_streams
    FROM monthly_track_aggregates 
    WHERE year_month >= $1 AND year_month <= $2
    GROUP BY year_month
    ORDER BY year_month
  `;

  const result = await client.query(query, [startYearMonth, endYearMonth]);

  const summary: Record<string, number> = {};
  result.rows.forEach((row: any) => {
    summary[row.year_month] = parseInt(row.total_streams);
  });

  return summary;
}

async function getLeaderboardYearlySummary(
  client: any,
  start_date: string,
  end_date: string
): Promise<Record<string, number>> {
  // Extract years from dates
  const startYear = parseInt(start_date.substring(0, 4));
  const endYear = parseInt(end_date.substring(0, 4));

  const query = `
    SELECT 
      year,
      SUM(yearly_play_count) as total_streams
    FROM yearly_track_aggregates 
    WHERE year >= $1 AND year <= $2
    GROUP BY year
    ORDER BY year
  `;

  const result = await client.query(query, [startYear, endYear]);

  const summary: Record<string, number> = {};
  result.rows.forEach((row: any) => {
    summary[row.year.toString()] = parseInt(row.total_streams);
  });

  return summary;
}

async function getUniqueEntries(
  client: any,
  type: "song" | "artist" | "album",
  start_date: string,
  end_date: string
): Promise<number> {
  let query: string;
  let params: any[];

  if (type === "song") {
    query = `
      SELECT COUNT(DISTINCT track_id) as unique_count
      FROM daily_track_aggregates 
      WHERE date >= $1 AND date <= $2
    `;
    params = [start_date, end_date];
  } else if (type === "artist") {
    query = `
      SELECT COUNT(DISTINCT artist_id) as unique_count
      FROM daily_artist_aggregates 
      WHERE date >= $1 AND date <= $2
    `;
    params = [start_date, end_date];
  } else if (type === "album") {
    query = `
      SELECT COUNT(DISTINCT album_id) as unique_count
      FROM daily_album_aggregates 
      WHERE date >= $1 AND date <= $2
    `;
    params = [start_date, end_date];
  } else {
    throw new Error(`Unsupported type: ${type}`);
  }

  const result = await client.query(query, params);
  return parseInt(result.rows[0].unique_count);
}
