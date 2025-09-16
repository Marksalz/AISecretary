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

// Read events from Google Calendar
export async function getEventsFromGoogleCalendar(
  accessToken,
  refreshToken,
  timeMin,
  timeMax
) {
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
  try {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin ? new Date(timeMin).toISOString() : undefined,
      timeMax: timeMax ? new Date(timeMax).toISOString() : undefined,
      singleEvents: true,
      orderBy: "startTime",
    });
    return response.data.items;
  } catch (err) {
    const message =
      err?.response?.data || err.message || "Failed to fetch events";
    throw new Error(message);
  }
}

// Update an event in Google Calendar
export async function updateEventInGoogleCalendar(
  eventId,
  eventDetails,
  accessToken,
  refreshToken
) {
  if (!eventId) {
    throw new Error("eventId is required");
  }
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
    const updated = await calendar.events.update({
      calendarId: "primary",
      eventId,
      requestBody: event,
    });
    return updated.data;
  } catch (err) {
    const message =
      err?.response?.data || err.message || "Failed to update event";
    throw new Error(message);
  }
}

// Delete an event from Google Calendar
export async function deleteEventFromGoogleCalendar(
  eventId,
  accessToken,
  refreshToken
) {
  if (!eventId) {
    throw new Error("eventId is required");
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
  try {
    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });
    return { success: true };
  } catch (err) {
    const message =
      err?.response?.data || err.message || "Failed to delete event";
    throw new Error(message);
  }
}
