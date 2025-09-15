import { google } from "googleapis";

export async function addEventToGoogleCalendar(
  eventDetails,
  accessToken,
  refreshToken
) {
  if (!eventDetails?.title || !eventDetails?.start || !eventDetails?.end) {
    throw new Error("title, start and end are required");
  }
  if (!accessToken || !refreshToken) {
    throw new Error("Google tokens not available");
  }

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
    summary: eventDetails.title,
    location: eventDetails.location || undefined,
    description: eventDetails.description || undefined,
    start: { dateTime: new Date(eventDetails.start).toISOString() },
    end: { dateTime: new Date(eventDetails.end).toISOString() },
  };

  try {
    const created = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });
    return created.data;
  } catch (err) {
    const message =
      err?.response?.data || err.message || "Failed to create event";
    throw new Error(message);
  }
}
