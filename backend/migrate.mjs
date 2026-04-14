import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use a SEPARATE pool for migration so we don't kill the shared pool
// that index.mjs will use after this script finishes.
const isProduction = process.env.NODE_ENV === 'production';

let poolConfig;
if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "ashutosh",
    database: process.env.DB_NAME || "booking_db",
    ssl: false,
  };
}

const pool = new pg.Pool(poolConfig);

async function runMigration() {
  try {
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log("Running schema migration...");
    console.log("DB URL set:", !!process.env.DATABASE_URL);
    console.log("NODE_ENV:", process.env.NODE_ENV);

    await pool.query(sql);
    console.log("Migration executed successfully! All 12 seat tables created & seeded.");
  } catch (error) {
    console.error("Migration failed:", error.message);
    // Don't crash — let index.mjs try to start anyway
  } finally {
    await pool.end();
  }
}

runMigration();
