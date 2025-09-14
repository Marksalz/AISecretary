import express from "express";
import jwt from "jsonwebtoken";

const authRouter = express.Router();

// Step 1: Redirect to Google OAuth
authRouter.get("/google", (req, res) => {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/calendar",
    ].join(" "),
  };

  const qs = new URLSearchParams(options);
  res.redirect(`${rootUrl}?${qs.toString()}`);
});

// Step 2: Handle Google callback
authRouter.get("/google/callback", async (req, res) => {
  const code = req.query.code;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const googleTokens = await tokenRes.json();
  console.log("Google tokens:", googleTokens);

  // Get user profile
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${googleTokens.access_token}` },
  });
  const user = await userRes.json();

  // TODO: Save user + googleTokens.refresh_token securely in your DB

  // Step 3: Create your own JWT for your app
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    googleAccessToken: googleTokens.access_token, // temporary access
    googleRefreshToken: googleTokens.refresh_token, // save in DB for later refresh
  };

  console.log("Payload:", payload);
  

  const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // Send back your own JWT (cookie-based or redirect)
  res.cookie("token", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.redirect("http://localhost:5173/welcome");
});

export default authRouter;
