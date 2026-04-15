import 'dotenv/config';
import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import db from "./config/db.mjs";
import { createServer } from "http";
import { expireHolds } from "./controllers/bookingController.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 8080;

const app = express();
const httpServer = createServer(app);

function isMissingRelationError(err) {
  return err && (err.code === "42P01" || /relation .* does not exist/i.test(err.message || ""));
}

async function ensureCoreSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      movie VARCHAR(50) NOT NULL,
      show_time VARCHAR(10) NOT NULL,
      seat_id INT NOT NULL,
      status VARCHAR(20) DEFAULT 'confirmed',
      held_until TIMESTAMPTZ,
      booked_at TIMESTAMPTZ DEFAULT NOW(),
      seat_number INT
    );
  `);

  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'bookings_movie_show_time_seat_id_key'
      ) THEN
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_movie_show_time_seat_id_key UNIQUE (movie, show_time, seat_id);
      END IF;
    END $$;
  `);

  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='status') THEN
        ALTER TABLE bookings ADD COLUMN status VARCHAR(20) DEFAULT 'confirmed';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='held_until') THEN
        ALTER TABLE bookings ADD COLUMN held_until TIMESTAMPTZ;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='booked_at') THEN
        ALTER TABLE bookings ADD COLUMN booked_at TIMESTAMPTZ DEFAULT NOW();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='seat_number') THEN
        ALTER TABLE bookings ADD COLUMN seat_number INT;
      END IF;
    END $$;
  `);
}

app.use(cors());
app.use(express.json());

import authRoutes from "./routes/authRoutes.mjs";
import bookingRoutes from "./routes/bookingRoutes.mjs";

app.use("/auth", authRoutes);
app.use("/book", bookingRoutes);

// --------------- Valid movie/time combos ---------------
const VALID_MOVIES = ["dhurandhar", "boothbangla", "dacoit", "hailmary"];
const VALID_TIMES  = ["9am", "2pm", "7pm"];

// Seat counts per slot
const SEAT_COUNTS = { "9am": 90, "2pm": 110, "7pm": 130 };

/**
 * Build a safe table name from movie + time.
 * Returns null if invalid.
 */
function getTableName(movie, time) {
  const m = (movie || "").toLowerCase();
  const t = (time || "").toLowerCase();
  if (!VALID_MOVIES.includes(m) || !VALID_TIMES.includes(t)) return null;
  return `seats_${m}_${t}`;
}

// --------------- GET all seats for a movie+time ---------------
// Usage: GET /seats?movie=dhurandhar&time=9am
app.get("/seats", async (req, res) => {
  const table = getTableName(req.query.movie, req.query.time);
  if (!table) {
    return res.status(400).json({ error: "Invalid or missing movie/time. Use ?movie=<key>&time=<slot>" });
  }
  try {
    const result = await db.query(`SELECT * FROM ${table} ORDER BY seat_number`);

    // Also fetch hold info for held seats so frontend can show countdown
    const movie = req.query.movie.toLowerCase();
    const time = req.query.time.toLowerCase();

    const holdMap = {};

    try {
      const holdsRes = await db.query(
        `SELECT seat_id, held_until, user_id FROM bookings
         WHERE movie = $1 AND show_time = $2 AND status = 'held'`,
        [movie, time]
      );
      holdsRes.rows.forEach(h => {
        holdMap[h.seat_id] = { held_until: h.held_until, user_id: h.user_id };
      });
    } catch (holdsErr) {
      if (!isMissingRelationError(holdsErr)) {
        throw holdsErr;
      }
    }

    // Merge hold info into seat data
    const seats = result.rows.map(seat => ({
      ...seat,
      held_until: holdMap[seat.id]?.held_until || null,
      held_by_user: holdMap[seat.id]?.user_id || null,
    }));

    res.json(seats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------- Legacy booking (no auth) ---------------
// Usage: PUT /book/legacy/:id/:name?movie=dhurandhar&time=9am
app.put("/book/legacy/:id/:name", async (req, res) => {
  const table = getTableName(req.query.movie, req.query.time);
  if (!table) {
    return res.status(400).json({ error: "Invalid or missing movie/time query params" });
  }

  try {
    const id = req.params.id;
    const name = req.params.name;
    const conn = await db.connect();
    await conn.query("BEGIN");

    const sql = `SELECT * FROM ${table} WHERE id = $1 AND isbooked = 0 FOR UPDATE`;
    const result = await conn.query(sql, [id]);

    if (result.rowCount === 0) {
      await conn.query("ROLLBACK");
      conn.release();
      return res.json({ error: "Seat already booked" });
    }

    const sqlU = `UPDATE ${table} SET isbooked = 1, name = $2 WHERE id = $1`;
    const updateResult = await conn.query(sqlU, [id, name]);
    await conn.query("COMMIT");
    conn.release();

    res.json(updateResult);
  } catch (ex) {
    console.log(ex);
    res.sendStatus(500);
  }
});

// ─── Periodic hold expiry (every 15 seconds) ─────────────────────
setInterval(() => expireHolds(), 15000);

async function bootstrap() {
  try {
    await ensureCoreSchema();
    console.log("Core schema verified");
  } catch (err) {
    console.error("Schema verification warning:", err.message || err);
  }

  httpServer.listen(port, () => console.log("Server starting on port: " + port));
}

bootstrap();
