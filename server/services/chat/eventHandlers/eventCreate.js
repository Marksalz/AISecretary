import { addEventToGoogleCalendar } from "../../../services/eventServices.js";
import { findConflicts } from "../../availability.js";
import { createChatResponse } from "../handlers/responseHandler.js";

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
        // Find the event with the closest overlap to the new event's start time
        const newStart = new Date(data.start);
        let best = null;
        let minDiff = Infinity;
        for (const ev of conflicts) {
          let s, e;
          if (ev.start?.dateTime) s = new Date(ev.start.dateTime);
          else if (ev.start?.date) s = new Date(`${ev.start.date}T00:00:00`);
          if (ev.end?.dateTime) e = new Date(ev.end.dateTime);
          else if (ev.end?.date) e = new Date(`${ev.end.date}T00:00:00`);
          // Only consider events that actually overlap
          if (s && e && newStart < e && new Date(data.end) > s) {
            const diff = Math.abs(newStart - s);
            if (diff < minDiff) {
              minDiff = diff;
              best = { ev, s, e };
            }
          }
        }
        if (best) {
          const fmt = (d) =>
            new Date(d).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            });
          const title = best.ev.summary || "(no title)";
          return createChatResponse(
            `That time overlaps with an existing event: "${title}" ${fmt(
              best.s
            )} - ${fmt(best.e)}. Please choose another time.`
          );
        }
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
