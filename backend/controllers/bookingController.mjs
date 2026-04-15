import pool from "../config/db.mjs";

const VALID_MOVIES = ["dhurandhar", "boothbangla", "dacoit", "hailmary"];
const VALID_TIMES  = ["9am", "2pm", "7pm"];
const MAX_SEATS_PER_USER = 5;
const HOLD_DURATION_MS = 2 * 60 * 1000; // 2 minutes
const BOOKING_TABLE = "seat_bookings";

function getSchemaErrorMessage(err) {
  const code = err?.code;
  if (code === "42P01") return "Database table missing. Please run migration and restart server.";
  if (code === "42703") return "Database column missing. Please run migration and restart server.";
  return null;
}

function getTableName(movie, time) {
  const m = (movie || "").toLowerCase();
  const t = (time || "").toLowerCase();
  if (!VALID_MOVIES.includes(m) || !VALID_TIMES.includes(t)) return null;
  return `seats_${m}_${t}`;
}

// ─── Hold a seat for 2 minutes ───────────────────────────────────
export const holdSeat = async (req, res) => {
  const table = getTableName(req.query.movie, req.query.time);
  if (!table) return res.status(400).json({ success: false, message: "Invalid movie/time" });

  const seatId = parseInt(req.params.id);
  const userId = req.user.id;
  const userName = req.user.name;
  const movie = req.query.movie.toLowerCase();
  const time = req.query.time.toLowerCase();

  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");

    // Count user's active bookings (held + confirmed) for this movie+time
    const countSql = `SELECT COUNT(*) as cnt FROM ${BOOKING_TABLE}
                      WHERE user_id = $1 AND movie = $2 AND show_time = $3
                      AND status IN ('held', 'confirmed')`;
    const countRes = await conn.query(countSql, [userId, movie, time]);
    if (parseInt(countRes.rows[0].cnt) >= MAX_SEATS_PER_USER) {
      await conn.query("ROLLBACK");
      conn.release();
      return res.status(400).json({ success: false, message: `Maximum ${MAX_SEATS_PER_USER} seats allowed per movie per showtime` });
    }

    // Lock the seat row and check availability (0 = available)
    const lockSql = `SELECT * FROM ${table} WHERE id = $1 AND isbooked = 0 FOR UPDATE`;
    const lockRes = await conn.query(lockSql, [seatId]);
    if (lockRes.rowCount === 0) {
      await conn.query("ROLLBACK");
      conn.release();
      return res.status(400).json({ success: false, message: "Seat unavailable or already held" });
    }

    const seatNumber = lockRes.rows[0].seat_number;
    const heldUntil = new Date(Date.now() + HOLD_DURATION_MS);

    // Mark seat as held (isbooked = 2)
    await conn.query(`UPDATE ${table} SET isbooked = 2, name = $2 WHERE id = $1`, [seatId, userName]);

    // Legacy deployments may not have the newer UNIQUE constraint needed for
    // ON CONFLICT (movie, show_time, seat_id), so perform a manual upsert.
    const existingBookingRes = await conn.query(
      `SELECT id, status FROM ${BOOKING_TABLE}
       WHERE movie = $1 AND show_time = $2 AND seat_id = $3
       LIMIT 1
       FOR UPDATE`,
      [movie, time, seatId]
    );

    if (existingBookingRes.rowCount > 0) {
      const existingBooking = existingBookingRes.rows[0];

      if (existingBooking.status === "confirmed") {
        await conn.query("ROLLBACK");
        conn.release();
        return res.status(400).json({ success: false, message: "Seat already booked" });
      }

      await conn.query(
        `UPDATE ${BOOKING_TABLE}
         SET user_id = $1, movie = $2, show_time = $3, seat_id = $4, seat_number = $5,
             status = 'held', held_until = $6
         WHERE id = $7`,
        [userId, movie, time, seatId, seatNumber, heldUntil, existingBooking.id]
      );
    } else {
      await conn.query(
        `INSERT INTO ${BOOKING_TABLE} (user_id, movie, show_time, seat_id, seat_number, status, held_until)
         VALUES ($1, $2, $3, $4, $5, 'held', $6)`,
        [userId, movie, time, seatId, seatNumber, heldUntil]
      );
    }

    await conn.query("COMMIT");
    conn.release();

    res.json({
      success: true,
      message: "Seat held for 2 minutes",
      seatId,
      seatNumber,
      heldUntil: heldUntil.toISOString(),
    });
  } catch (err) {
    await conn.query("ROLLBACK");
    conn.release();
    console.error("Hold Error:", err);
    const schemaMessage = getSchemaErrorMessage(err);
    if (schemaMessage) {
      return res.status(503).json({ success: false, message: schemaMessage });
    }
    if (err.code === "23505") {
      return res.status(400).json({ success: false, message: "Seat already held/booked" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── Release a held seat (user deselects) ────────────────────────
export const releaseSeat = async (req, res) => {
  const table = getTableName(req.query.movie, req.query.time);
  if (!table) return res.status(400).json({ success: false, message: "Invalid movie/time" });

  const seatId = parseInt(req.params.id);
  const userId = req.user.id;
  const movie = req.query.movie.toLowerCase();
  const time = req.query.time.toLowerCase();

  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");

    // Only delete if this user holds it
    const delRes = await conn.query(
      `DELETE FROM ${BOOKING_TABLE} WHERE user_id = $1 AND movie = $2 AND show_time = $3 AND seat_id = $4 AND status = 'held'`,
      [userId, movie, time, seatId]
    );

    if (delRes.rowCount > 0) {
      await conn.query(`UPDATE ${table} SET isbooked = 0, name = NULL WHERE id = $1`, [seatId]);
    }

    await conn.query("COMMIT");
    conn.release();

    res.json({ success: true, message: "Seat released" });
  } catch (err) {
    await conn.query("ROLLBACK");
    conn.release();
    console.error("Release Error:", err);
    const schemaMessage = getSchemaErrorMessage(err);
    if (schemaMessage) {
      return res.status(503).json({ success: false, message: schemaMessage });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── Confirm all held seats for this user + movie + time ─────────
export const confirmBooking = async (req, res) => {
  const movie = (req.query.movie || "").toLowerCase();
  const time = (req.query.time || "").toLowerCase();
  const table = getTableName(movie, time);
  if (!table) return res.status(400).json({ success: false, message: "Invalid movie/time" });

  const userId = req.user.id;
  const userName = req.user.name;

  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");

    // Get all held seats for this user+movie+time
    const heldSql = `SELECT seat_id FROM ${BOOKING_TABLE}
                     WHERE user_id = $1 AND movie = $2 AND show_time = $3 AND status = 'held'`;
    const heldRes = await conn.query(heldSql, [userId, movie, time]);

    if (heldRes.rowCount === 0) {
      await conn.query("ROLLBACK");
      conn.release();
      return res.status(400).json({ success: false, message: "No held seats to confirm" });
    }

    const seatIds = heldRes.rows.map(r => r.seat_id);

    // Confirm in bookings table
    await conn.query(
      `UPDATE ${BOOKING_TABLE} SET status = 'confirmed', held_until = NULL, booked_at = NOW()
       WHERE user_id = $1 AND movie = $2 AND show_time = $3 AND status = 'held'`,
      [userId, movie, time]
    );

    // Mark seats as booked (isbooked = 1) in seat table
    for (const sid of seatIds) {
      await conn.query(`UPDATE ${table} SET isbooked = 1, name = $2 WHERE id = $1`, [sid, userName]);
    }

    await conn.query("COMMIT");
    conn.release();

    res.json({ success: true, message: "Booking confirmed!", seatIds });
  } catch (err) {
    await conn.query("ROLLBACK");
    conn.release();
    console.error("Confirm Error:", err);
    const schemaMessage = getSchemaErrorMessage(err);
    if (schemaMessage) {
      return res.status(503).json({ success: false, message: schemaMessage });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── Cancel a confirmed booking ──────────────────────────────────
export const cancelBooking = async (req, res) => {
  const bookingId = parseInt(req.params.bookingId);
  const userId = req.user.id;

  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");

    // Find the booking
    const bkRes = await conn.query(
      `SELECT * FROM ${BOOKING_TABLE} WHERE id = $1 AND user_id = $2 AND status = 'confirmed'`,
      [bookingId, userId]
    );

    if (bkRes.rowCount === 0) {
      await conn.query("ROLLBACK");
      conn.release();
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const booking = bkRes.rows[0];
    const table = getTableName(booking.movie, booking.show_time);
    if (!table) {
      await conn.query("ROLLBACK");
      conn.release();
      return res.status(400).json({ success: false, message: "Invalid booking data" });
    }

    // Free the seat
    await conn.query(`UPDATE ${table} SET isbooked = 0, name = NULL WHERE id = $1`, [booking.seat_id]);

    // Delete the booking record
    await conn.query(`DELETE FROM ${BOOKING_TABLE} WHERE id = $1`, [bookingId]);

    await conn.query("COMMIT");
    conn.release();

    res.json({
      success: true,
      message: "Booking cancelled",
      movie: booking.movie,
      show_time: booking.show_time,
      seatId: booking.seat_id,
    });
  } catch (err) {
    await conn.query("ROLLBACK");
    conn.release();
    console.error("Cancel Error:", err);
    const schemaMessage = getSchemaErrorMessage(err);
    if (schemaMessage) {
      return res.status(503).json({ success: false, message: schemaMessage });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── Get user's bookings ─────────────────────────────────────────
export const getMyBookings = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT id, movie, show_time, seat_id, seat_number, status, booked_at
       FROM ${BOOKING_TABLE}
       WHERE user_id = $1 AND status = 'confirmed'
       ORDER BY booked_at DESC`,
      [userId]
    );
    res.json({ success: true, bookings: result.rows });
  } catch (err) {
    console.error("MyBookings Error:", err);
    const schemaMessage = getSchemaErrorMessage(err);
    if (schemaMessage) {
      return res.status(503).json({ success: false, message: schemaMessage });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── Expire stale holds (called periodically) ────────────────────
export const expireHolds = async () => {
  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");

    // Find all expired holds
    const expired = await conn.query(
      `SELECT id, movie, show_time, seat_id FROM ${BOOKING_TABLE}
       WHERE status = 'held' AND held_until < NOW()`
    );

    for (const row of expired.rows) {
      const table = getTableName(row.movie, row.show_time);
      if (table) {
        await conn.query(`UPDATE ${table} SET isbooked = 0, name = NULL WHERE id = $1`, [row.seat_id]);
      }
    }

    // Delete expired holds
    await conn.query(`DELETE FROM ${BOOKING_TABLE} WHERE status = 'held' AND held_until < NOW()`);

    await conn.query("COMMIT");
    conn.release();

    if (expired.rowCount > 0) {
      console.log(`🧹 Expired ${expired.rowCount} held seat(s)`);
    }
  } catch (err) {
    await conn.query("ROLLBACK");
    conn.release();
    console.error("ExpireHolds Error:", err);
  }
};
