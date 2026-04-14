import pool from "../config/db.mjs";

export const bookSeat = async (req, res) => {
  try {
    const seatId = req.params.id;
    const userId = req.user.id;
    const userName = req.user.name;

    const conn = await pool.connect();
    
    try {
      await conn.query("BEGIN");

      // Check if seat is available and lock the row
      const selectSql = "SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE";
      const result = await conn.query(selectSql, [seatId]);

      if (result.rowCount === 0) {
        await conn.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Seat already booked or does not exist" });
      }

      // Instead of relying on a name parameter, we use the logged-in user's name
      // and we update the seats table
      const updateSeatSql = "UPDATE seats SET isbooked = 1, name = $2 WHERE id = $1";
      await conn.query(updateSeatSql, [seatId, userName]);

      // Insert into the new bookings table as per Option B
      const insertBookingSql = "INSERT INTO bookings (user_id, seat_id) VALUES ($1, $2)";
      await conn.query(insertBookingSql, [userId, seatId]);

      await conn.query("COMMIT");
      
      res.status(200).json({ success: true, message: "Seat booked successfully" });
    } catch (err) {
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Booking Error:", error);
    // 23505 is PostgreSQL unique violation error code (for duplicate seat_id in bookings)
    if (error.code === '23505') {
       return res.status(400).json({ success: false, message: "Seat already booked" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};
