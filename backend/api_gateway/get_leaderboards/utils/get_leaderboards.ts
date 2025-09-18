const { getPool } = require("/opt/nodejs/db/pool");

export const getLeaderboards = async (
  type: string,
  granularity: string,
  offset: number,
  start_date: string,
  end_date: string
) => {
  const pool = await getPool();
  const client = await pool.connect();

  try {
    const limit = 50;

    // Route to appropriate helper function based on type and granularity
    let result;

    if (type === "song" || type === "track") {
      if (granularity === "daily") {
        result = await getDailyTrackLeaderboard(
          client,
          offset,
          limit,
          start_date,
          end_date
        );
      } else if (granularity === "monthly") {
        result = await getMonthlyTrackLeaderboard(
          client,
          offset,
          limit,
          start_date,
          end_date
        );
      } else if (granularity === "yearly") {
        result = await getYearlyTrackLeaderboard(
          client,
          offset,
          limit,
          start_date,
          end_date
        );
      } else {
        throw new Error(`Invalid granularity: ${granularity}`);
      }
    } else if (type === "artist") {
      if (granularity === "daily") {
        result = await getDailyArtistLeaderboard(
          client,
          offset,
          limit,
          start_date,
          end_date
        );
      } else if (granularity === "monthly") {
        result = await getMonthlyArtistLeaderboard(
          client,
          offset,
          limit,
          start_date,
          end_date
        );
      } else if (granularity === "yearly") {
        result = await getYearlyArtistLeaderboard(
          client,
          offset,
          limit,
          start_date,
          end_date
        );
      } else {
        throw new Error(`Invalid granularity: ${granularity}`);
      }
    } else if (type === "album") {
      if (granularity === "daily") {
        result = await getDailyAlbumLeaderboard(
          client,
          offset,
          limit,
          start_date,
          end_date
        );
      } else if (granularity === "monthly") {
        result = await getMonthlyAlbumLeaderboard(
          client,
          offset,
          limit,
          start_date,
          end_date
        );
      } else if (granularity === "yearly") {
        result = await getYearlyAlbumLeaderboard(
          client,
          offset,
          limit,
          start_date,
          end_date
        );
      } else {
        throw new Error(`Invalid granularity: ${granularity}`);
      }
    } else {
      throw new Error(`Invalid type: ${type}`);
    }

    return result;
  } catch (error) {
    console.error("Error fetching leaderboards:", error);
    throw error;
  } finally {
    client.release();
  }
};

// Daily Track Leaderboard
async function getDailyTrackLeaderboard(
  client: any,
  offset: number,
  limit: number,
  start_date: string,
  end_date: string
) {
  const query = `
    SELECT 
      track_id,
      track_name,
      artist_id,
      artist_name,
      album_id,
      album_name,
      album_cover_url,
      SUM(daily_play_count) as total_plays
    FROM daily_track_aggregates
    WHERE date >= $1 AND date <= $2
    GROUP BY track_id, track_name, artist_id, artist_name, album_id, album_name, album_cover_url
    ORDER BY total_plays DESC
    LIMIT $3 OFFSET $4
  `;

  const result = await client.query(query, [
    start_date,
    end_date,
    limit,
    offset,
  ]);
  return result.rows.map((row: any, index: number) => ({
    rank: offset + index + 1,
    track_id: row.track_id,
    track_name: row.track_name,
    artist_id: row.artist_id,
    artist_name: row.artist_name,
    album_id: row.album_id,
    album_name: row.album_name,
    album_cover_url: row.album_cover_url,
    total_plays: parseInt(row.total_plays),
  }));
}

// Monthly Track Leaderboard
async function getMonthlyTrackLeaderboard(
  client: any,
  offset: number,
  limit: number,
  start_date: string,
  end_date: string
) {
  const query = `
    SELECT 
      track_id,
      track_name,
      artist_id,
      artist_name,
      album_id,
      album_name,
      album_cover_url,
      SUM(monthly_play_count) as total_plays
    FROM monthly_track_aggregates
    WHERE year_month >= $1 AND year_month <= $2
    GROUP BY track_id, track_name, artist_id, artist_name, album_id, album_name, album_cover_url
    ORDER BY total_plays DESC
    LIMIT $3 OFFSET $4
  `;

  const result = await client.query(query, [
    start_date,
    end_date,
    limit,
    offset,
  ]);
  return result.rows.map((row: any, index: number) => ({
    rank: offset + index + 1,
    track_id: row.track_id,
    track_name: row.track_name,
    artist_id: row.artist_id,
    artist_name: row.artist_name,
    album_id: row.album_id,
    album_name: row.album_name,
    album_cover_url: row.album_cover_url,
    total_plays: parseInt(row.total_plays),
  }));
}

// Yearly Track Leaderboard
async function getYearlyTrackLeaderboard(
  client: any,
  offset: number,
  limit: number,
  start_date: string,
  end_date: string
) {
  const query = `
    SELECT 
      track_id,
      track_name,
      artist_id,
      artist_name,
      album_id,
      album_name,
      album_cover_url,
      SUM(yearly_play_count) as total_plays
    FROM yearly_track_aggregates
    WHERE year >= $1 AND year <= $2
    GROUP BY track_id, track_name, artist_id, artist_name, album_id, album_name, album_cover_url
    ORDER BY total_plays DESC
    LIMIT $3 OFFSET $4
  `;

  const result = await client.query(query, [
    parseInt(start_date),
    parseInt(end_date),
    limit,
    offset,
  ]);
  return result.rows.map((row: any, index: number) => ({
    rank: offset + index + 1,
    track_id: row.track_id,
    track_name: row.track_name,
    artist_id: row.artist_id,
    artist_name: row.artist_name,
    album_id: row.album_id,
    album_name: row.album_name,
    album_cover_url: row.album_cover_url,
    total_plays: parseInt(row.total_plays),
  }));
}

// Daily Artist Leaderboard
async function getDailyArtistLeaderboard(
  client: any,
  offset: number,
  limit: number,
  start_date: string,
  end_date: string
) {
  const query = `
    SELECT 
      artist_id,
      artist_name,
      genre,
      artist_image_url,
      SUM(daily_play_count) as total_plays
    FROM daily_artist_aggregates
    WHERE date >= $1 AND date <= $2
    GROUP BY artist_id, artist_name, genre, artist_image_url
    ORDER BY total_plays DESC
    LIMIT $3 OFFSET $4
  `;

  const result = await client.query(query, [
    start_date,
    end_date,
    limit,
    offset,
  ]);
  return result.rows.map((row: any, index: number) => ({
    rank: offset + index + 1,
    artist_id: row.artist_id,
    artist_name: row.artist_name,
    genre: row.genre,
    artist_image_url: row.artist_image_url,
    total_plays: parseInt(row.total_plays),
  }));
}

// Monthly Artist Leaderboard
async function getMonthlyArtistLeaderboard(
  client: any,
  offset: number,
  limit: number,
  start_date: string,
  end_date: string
) {
  const query = `
    SELECT 
      artist_id,
      artist_name,
      genre,
      artist_image_url,
      SUM(monthly_play_count) as total_plays
    FROM monthly_artist_aggregates
    WHERE year_month >= $1 AND year_month <= $2
    GROUP BY artist_id, artist_name, genre, artist_image_url
    ORDER BY total_plays DESC
    LIMIT $3 OFFSET $4
  `;

  const result = await client.query(query, [
    start_date,
    end_date,
    limit,
    offset,
  ]);
  return result.rows.map((row: any, index: number) => ({
    rank: offset + index + 1,
    artist_id: row.artist_id,
    artist_name: row.artist_name,
    genre: row.genre,
    artist_image_url: row.artist_image_url,
    total_plays: parseInt(row.total_plays),
  }));
}

// Yearly Artist Leaderboard
async function getYearlyArtistLeaderboard(
  client: any,
  offset: number,
  limit: number,
  start_date: string,
  end_date: string
) {
  const query = `
    SELECT 
      artist_id,
      artist_name,
      genre,
      artist_image_url,
      SUM(yearly_play_count) as total_plays
    FROM yearly_artist_aggregates
    WHERE year >= $1 AND year <= $2
    GROUP BY artist_id, artist_name, genre, artist_image_url
    ORDER BY total_plays DESC
    LIMIT $3 OFFSET $4
  `;

  const result = await client.query(query, [
    parseInt(start_date),
    parseInt(end_date),
    limit,
    offset,
  ]);
  return result.rows.map((row: any, index: number) => ({
    rank: offset + index + 1,
    artist_id: row.artist_id,
    artist_name: row.artist_name,
    genre: row.genre,
    artist_image_url: row.artist_image_url,
    total_plays: parseInt(row.total_plays),
  }));
}

// Daily Album Leaderboard
async function getDailyAlbumLeaderboard(
  client: any,
  offset: number,
  limit: number,
  start_date: string,
  end_date: string
) {
  const query = `
    SELECT 
      album_id,
      album_name,
      artist_id,
      artist_name,
      album_cover_url,
      SUM(daily_play_count) as total_plays
    FROM daily_album_aggregates
    WHERE date >= $1 AND date <= $2
    GROUP BY album_id, album_name, artist_id, artist_name, album_cover_url
    ORDER BY total_plays DESC
    LIMIT $3 OFFSET $4
  `;

  const result = await client.query(query, [
    start_date,
    end_date,
    limit,
    offset,
  ]);
  return result.rows.map((row: any, index: number) => ({
    rank: offset + index + 1,
    album_id: row.album_id,
    album_name: row.album_name,
    artist_id: row.artist_id,
    artist_name: row.artist_name,
    album_cover_url: row.album_cover_url,
    total_plays: parseInt(row.total_plays),
  }));
}

// Monthly Album Leaderboard
async function getMonthlyAlbumLeaderboard(
  client: any,
  offset: number,
  limit: number,
  start_date: string,
  end_date: string
) {
  const query = `
    SELECT 
      album_id,
      album_name,
      artist_id,
      artist_name,
      album_cover_url,
      SUM(monthly_play_count) as total_plays
    FROM monthly_album_aggregates
    WHERE year_month >= $1 AND year_month <= $2
    GROUP BY album_id, album_name, artist_id, artist_name, album_cover_url
    ORDER BY total_plays DESC
    LIMIT $3 OFFSET $4
  `;

  const result = await client.query(query, [
    start_date,
    end_date,
    limit,
    offset,
  ]);
  return result.rows.map((row: any, index: number) => ({
    rank: offset + index + 1,
    album_id: row.album_id,
    album_name: row.album_name,
    artist_id: row.artist_id,
    artist_name: row.artist_name,
    album_cover_url: row.album_cover_url,
    total_plays: parseInt(row.total_plays),
  }));
}

// Yearly Album Leaderboard
async function getYearlyAlbumLeaderboard(
  client: any,
  offset: number,
  limit: number,
  start_date: string,
  end_date: string
) {
  const query = `
    SELECT 
      album_id,
      album_name,
      artist_id,
      artist_name,
      album_cover_url,
      SUM(yearly_play_count) as total_plays
    FROM yearly_album_aggregates
    WHERE year >= $1 AND year <= $2
    GROUP BY album_id, album_name, artist_id, artist_name, album_cover_url
    ORDER BY total_plays DESC
    LIMIT $3 OFFSET $4
  `;

  const result = await client.query(query, [
    parseInt(start_date),
    parseInt(end_date),
    limit,
    offset,
  ]);
  return result.rows.map((row: any, index: number) => ({
    rank: offset + index + 1,
    album_id: row.album_id,
    album_name: row.album_name,
    artist_id: row.artist_id,
    artist_name: row.artist_name,
    album_cover_url: row.album_cover_url,
    total_plays: parseInt(row.total_plays),
  }));
}
