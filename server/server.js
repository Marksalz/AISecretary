import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import router from "./routes/routes.js";

dotenv.config();
const app = express();

app.use(cookieParser());

// Routes
app.use(router);

app.listen(3000, () => console.log("Server running at http://localhost:3000"));
