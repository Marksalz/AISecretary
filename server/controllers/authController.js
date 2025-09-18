import jwt from "jsonwebtoken";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export const authController = {
  // Step 1: Redirect to Google OAuth
  googleRedirect: (req, res) => {
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
  },

  // Step 2: Handle Google callback
  googleCallback: async (req, res) => {
    const code = req.query.code;
    // Exchange code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
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

    // Get user profile
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
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
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    // Send back your own JWT (cookie-based)
    res.cookie("token", jwtToken, {
      httpOnly: true,
    });
    res.redirect("https://myaisecretary.netlify.app/chat");
    //res.redirect("http://localhost:5173/chat");
  },
};
