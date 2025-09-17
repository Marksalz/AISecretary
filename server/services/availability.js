import { getEventsFromGoogleCalendar } from "./eventServices.js";

function toRange(ev) {
  let s = null;
  let e = null;
  if (ev.start?.dateTime) s = new Date(ev.start.dateTime);
  else if (ev.start?.date) s = new Date(`${ev.start.date}T00:00:00`);
  if (ev.end?.dateTime) e = new Date(ev.end.dateTime);
  else if (ev.end?.date) e = new Date(`${ev.end.date}T00:00:00`);
  return { s, e };
}

export function eventsOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB; // [A) overlaps [B)
}

export async function isBusyAt(accessToken, refreshToken, instantIso) {
  if (!instantIso) return null;
  const instant = new Date(instantIso);
  if (Number.isNaN(instant.getTime())) return null;

  const windowMin = new Date(instant.getTime() - 12 * 60 * 60 * 1000);
  const windowMax = new Date(instant.getTime() + 12 * 60 * 60 * 1000);
  const events = await getEventsFromGoogleCalendar(
    accessToken,
    refreshToken,
    windowMin.toISOString(),
    windowMax.toISOString()
  );

  return (
    events.find((ev) => {
      const { s, e } = toRange(ev);
      if (!s || !e) return false;
      return instant >= s && instant < e;
    }) || null
  );
}

export async function findConflicts(
  accessToken,
  refreshToken,
  startIso,
  endIso
) {
  if (!startIso || !endIso) return [];
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  // Expand window to catch events that span across boundaries
  const windowMin = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const windowMax = new Date(end.getTime() + 24 * 60 * 60 * 1000);

  const events = await getEventsFromGoogleCalendar(
    accessToken,
    refreshToken,
    windowMin.toISOString(),
    windowMax.toISOString()
  );

  return events.filter((ev) => {
    const { s, e } = toRange(ev);
    if (!s || !e) return false;
    // Debug logging for overlap diagnosis
    console.log("[findConflicts] Checking overlap:", {
      newEvent: { start: start.toISOString(), end: end.toISOString() },
      existingEvent: {
        s: s.toISOString(),
        e: e.toISOString(),
        summary: ev.summary,
      },
    });
    return eventsOverlap(start, end, s, e);
  });
}
