import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 5000,
});

async function runMigration() {
  console.log("Connecting to database...");
  console.log("URL:", process.env.DATABASE_URL ? "Set (hidden)" : "NOT SET");

  try {
    const client = await pool.connect();
    console.log("Connected successfully!");

    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log("Running schema migration...");
    await client.query(sql);
    console.log("Migration executed successfully!");
    client.release();
  } catch (error) {
    console.error("Migration failed:", error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Timeout after 30 seconds
setTimeout(() => {
  console.error("Migration timed out after 30 seconds");
  process.exit(1);
}, 30000);

runMigration();
