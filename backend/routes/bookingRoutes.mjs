import express from "express";
import { bookSeat } from "../controllers/bookingController.mjs";
import { authMiddleware } from "../middleware/authUser.mjs";

const router = express.Router();

router.put("/:id", authMiddleware, bookSeat);

export default router;
