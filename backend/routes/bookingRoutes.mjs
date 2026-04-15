import express from "express";
import {
  holdSeat,
  releaseSeat,
  confirmBooking,
  cancelBooking,
  getMyBookings,
} from "../controllers/bookingController.mjs";
import { authMiddleware } from "../middleware/authUser.mjs";

const router = express.Router();

// Hold a seat for 2 min  — POST /book/hold/:id?movie=...&time=...
router.post("/hold/:id", authMiddleware, holdSeat);

// Release a held seat     — POST /book/release/:id?movie=...&time=...
router.post("/release/:id", authMiddleware, releaseSeat);

// Confirm all held seats  — POST /book/confirm?movie=...&time=...
router.post("/confirm", authMiddleware, confirmBooking);

// Cancel a confirmed booking — DELETE /book/cancel/:bookingId
router.delete("/cancel/:bookingId", authMiddleware, cancelBooking);

// Get user's bookings     — GET /book/my-bookings
router.get("/my-bookings", authMiddleware, getMyBookings);

export default router;
