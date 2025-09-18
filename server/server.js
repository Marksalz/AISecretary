import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "https://myaisecretary.netlify.app",
    credentials: true,
  })
);
app.use(cookieParser());

// Routes
app.use(router);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
