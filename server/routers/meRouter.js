// routes/me.js
import express from "express";
import jwt from "jsonwebtoken";

const meRouter = express.Router();

meRouter.get("/me", (req, res) => {
  try {
    // If you're using a cookie called "token"
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(token);
    
    // You can either return what's inside the JWT or fetch user from DB
    // Assuming JWT contains { id, name, email, picture }
    res.json({ user: decoded });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default meRouter;
