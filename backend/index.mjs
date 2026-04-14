import 'dotenv/config';
import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import db from "./config/db.mjs";
import { createServer } from "http";
import { Server } from "socket.io";

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 8080;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

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
    res.json(result.rows);
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

    // Emit seat update event to all clients
    io.emit("seatUpdated", {
      seatId: id,
      name,
      movie: req.query.movie,
      time: req.query.time
    });

    res.json(updateResult);
  } catch (ex) {
    console.log(ex);
    res.sendStatus(500);
  }
});

httpServer.listen(port, () => console.log("Server starting on port: " + port));
