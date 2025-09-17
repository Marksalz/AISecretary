import { addEventToGoogleCalendar } from "../../../services/eventServices.js";
import { findConflicts } from "../../availability.js";
import { createChatResponse } from "../responseHandler.js";

export default async function createEvent(
  data,
  googleAccessToken,
  googleRefreshToken
) {
  try {
    // Defensive overlap guard
    if (data?.start && data?.end) {
      const conflicts = await findConflicts(
        googleAccessToken,
        googleRefreshToken,
        data.start,
        data.end
      );
      if (conflicts.length > 0) {
        const first = conflicts[0];
        let s, e;
        if (first.start?.dateTime) s = new Date(first.start.dateTime);
        else if (first.start?.date)
          s = new Date(`${first.start.date}T00:00:00`);
        if (first.end?.dateTime) e = new Date(first.end.dateTime);
        else if (first.end?.date) e = new Date(`${first.end.date}T00:00:00`);
        const fmt = (d) =>
          new Date(d).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          });
        const title = first.summary || "(no title)";
        return createChatResponse(
          `That time overlaps with an existing event: "${title}" ${fmt(
            s
          )} - ${fmt(e)}. Please choose another time.`
        );
      }
    }
    const created = await addEventToGoogleCalendar(
      data,
      googleAccessToken,
      googleRefreshToken
    );
    return {
      success: true,
      data: {
        type: "calendar_event_added",
        message: `✅ Event "${created.summary}" has been added to your Google Calendar.`,
        event: created,
      },
    };
  } catch (err) {
    return createChatResponse("Failed to add event: " + err.message);
  }
}
