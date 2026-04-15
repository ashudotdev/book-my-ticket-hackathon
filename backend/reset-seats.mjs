import db from "./config/db.mjs";

async function resetSeats() {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Find all dynamic seat tables like seats_dhurandhar_9am
    const tablesRes = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename LIKE 'seats_%'
      ORDER BY tablename
    `);

    if (tablesRes.rowCount === 0) {
      throw new Error("No seat tables found (expected tables like seats_*).");
    }

    // Reset every seat to available
    for (const row of tablesRes.rows) {
      const table = row.tablename;
      await client.query(`UPDATE ${table} SET isbooked = 0, name = NULL`);
    }

    // Clear booking/hold records and reset id sequence
    await client.query("TRUNCATE TABLE bookings RESTART IDENTITY");

    await client.query("COMMIT");

    console.log(`✅ Reset complete: ${tablesRes.rowCount} seat tables updated and bookings cleared.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Seat reset failed:", error.message || error);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.end();
  }
}

resetSeats();
