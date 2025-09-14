import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import chatRoutes from "./routers/chatRouter.js";

import cookieParser from "cookie-parser";
import router from "./routes/routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// Routes
app.use(router);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
app.listen(3000, () => console.log("Server running at http://localhost:3000"));
