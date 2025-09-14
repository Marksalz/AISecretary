import { google } from "googleapis";
import { getAuthClient } from "./googleAuth.js";

export async function addEvent(title, start, end, description = "") {
  const auth = await getAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary: title,
    description,
    start: { dateTime: start },
    end: { dateTime: end },
  };

  const response = calendar.events.insert({
    calendarId: "primary",
    resource: event,
  });

  return response;
}

export async function listEvents(keyword) {
  const auth = await getAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  const res = calendar.events.list({
    calendarId: "primary",
    maxResults: 50,
    singleEvents: true,
    orderBy: "startTime",
  });

  if (keyword) {
    return res.data.items.filter((e) =>
      e.summary.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  return res.data.items;
}
