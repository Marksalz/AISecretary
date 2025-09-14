import { google } from "googleapis";

// Controller to create an event in the user's Google Calendar
async function createEvent(req, res) {
  try {
    const { title, start, end, location, description } = req.body;

    if (!title || !start || !end) {
      return res
        .status(400)
        .json({ error: "title, start and end are required" });
    }

    // Expecting middleware to attach decoded JWT payload to req.user
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const accessToken = user.googleAccessToken;
    const refreshToken = user.googleRefreshToken;

    if (!accessToken || !refreshToken) {
      return res
        .status(400)
        .json({ error: "Google tokens not available on user token" });
    }

    // Set up OAuth2 client
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oAuth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const event = {
      summary: title,
      location: location || undefined,
      description: description || undefined,
      start: { dateTime: new Date(start).toISOString() },
      end: { dateTime: new Date(end).toISOString() },
    };

    const created = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return res.status(201).json({ success: true, data: created.data });
  } catch (err) {
    console.error("createEvent error:", err);
    // Try to surface google api error message if present
    const message =
      err?.response?.data || err.message || "Failed to create event";
    return res.status(500).json({ success: false, error: message });
  }
}

export { createEvent };
