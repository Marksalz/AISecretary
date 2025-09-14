import fs from "fs";
import { google } from "googleapis";
import express from "express";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const TOKEN_PATH = "server/token.json";
const CREDENTIALS_PATH = "credentials.json";

const router = express.Router();

function createOAuthClient() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_id, client_secret, redirect_uris } = credentials.web;

  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

export async function getAuthClient() {
  const oAuth2Client = createOAuthClient();

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  throw new Error("No token found. Visit /auth to authorize.");
}

// Start OAuth flow
router.get("/auth", (req, res) => {
  const oAuth2Client = createOAuthClient();
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  res.redirect(authUrl);
});

// OAuth2 callback
router.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code");

  const oAuth2Client = createOAuthClient();

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log("Token stored to", TOKEN_PATH);

    res.send(
      "Google Calendar authorization successful! You can close this tab."
    );
  } catch (err) {
    console.error("Error retrieving access token", err);
    res.status(500).send("Error retrieving access token");
  }
});

export default router;
