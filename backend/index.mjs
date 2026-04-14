//  CREATE TABLE seats (
//      id SERIAL PRIMARY KEY,
//      name VARCHAR(255),
//      isbooked INT DEFAULT 0
//  );
// INSERT INTO seats (isbooked)
// SELECT 0 FROM generate_series(1, 20);


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
const io = new Server(httpServer);

app.use(cors());
app.use(express.json());

import authRoutes from "./routes/authRoutes.mjs";
import bookingRoutes from "./routes/bookingRoutes.mjs";

app.use("/auth", authRoutes);
app.use("/book", bookingRoutes);





//get all seats
app.get("/seats", async (req, res) => {
  const result = await db.query("select * from seats");
  res.send(result.rows);
});

//book a seat give the seatId and your name
app.put("/:id/:name", async (req, res) => {
  try {
    const id = req.params.id;
    const name = req.params.name;
    const conn = await db.connect();
    await conn.query("BEGIN");
    const sql = "SELECT * FROM seats where id = $1 and isbooked = 0 FOR UPDATE";
    const result = await conn.query(sql, [id]);
    if (result.rowCount === 0) {
      res.send({ error: "Seat already booked" });
      return;
    }
    const sqlU = "update seats set isbooked = 1, name = $2 where id = $1";
    const updateResult = await conn.query(sqlU, [id, name]);
    await conn.query("COMMIT");
    conn.release();
    // Emit seat update event to all clients
    io.emit("seatUpdated", { seatId: id, name });
    res.send(updateResult);
  } catch (ex) {
    console.log(ex);
    res.sendStatus(500);
  }
});

httpServer.listen(port, () => console.log("Server starting on port: " + port));
