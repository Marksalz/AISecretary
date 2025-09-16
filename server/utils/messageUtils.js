export function isEventRequest(normalizedMsg) {
  return /(add|create|schedule|calendar|meeting|appointment|event|book|set up|arrange)/.test(
    normalizedMsg
  );
}

export function isEventQuery(normalizedMsg) {
  return /(what do i have|show me|my agenda|today|tomorrow|when is|at what time|next meeting|upcoming events)/.test(
    normalizedMsg
  );
}

export function normalize(message) {
  return message.trim().toLowerCase();
}
