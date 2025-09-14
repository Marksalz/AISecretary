import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import router from "./routes/routes.js";

dotenv.config();
const app = express();

app.use(cookieParser());

// Routes
app.use(router);

// Example protected route
app.get("/me", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json(decoded);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));
