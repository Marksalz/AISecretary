import express from "express";
import { requireAuth } from "../middleware/middleware.js";
import { createEvent } from "../controllers/eventsController.js";

const eventsRouter = express.Router();

// POST /events/create
eventsRouter.post("/create", requireAuth, createEvent);

export default eventsRouter;
