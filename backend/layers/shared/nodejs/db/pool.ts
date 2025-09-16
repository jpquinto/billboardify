import { Pool } from "pg";

let pool: Pool | null = null;

const { DB_HOST, DB_USERNAME, DB_PASSWORD } = process.env;

/**
 * Creates a new PostgreSQL connection pool using credentials from AWS Secrets Manager.
 */
async function createPool() {
  return new Pool({
    host: DB_HOST,
    port: 5432,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

/**
 * Lazily initializes and returns a PostgreSQL pool instance.
 * Sets up error and connection event logging.
 */
export async function getPool() {
  if (!pool) {
    pool = await createPool();
    console.log("✅ PostgreSQL pool created");

    // Error handling
    pool.on("error", (err: Error) => {
      console.error({ err }, "🚨 Unexpected error on idle PostgreSQL client");
    });

    // Connection monitoring
    pool.on("connect", () => {
      console.log("📡 New client connected to PostgreSQL");
    });
  }
  return pool;
}

/**
 * Gracefully closes the PostgreSQL pool if it exists.
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("✅ PostgreSQL pool closed");
  }
}
