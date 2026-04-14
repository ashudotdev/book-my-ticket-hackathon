import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './config/db.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log("Running schema migration...");
    await db.query(sql);
    console.log("Migration executed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // End the db pool to allow the script to exit
    await db.end();
  }
}

runMigration();
