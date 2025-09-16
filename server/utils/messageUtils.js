export function normalize(message) {
  return message.trim().toLowerCase();
}

export function isEventRequest(normalizedMsg) {
  return /\b(add|create|schedule|set up|book|arrange|organize|plan)\b.*\b(meeting|appointment|event|reminder)\b/.test(
    normalizedMsg
  );
}

export function isEventQuery(normalizedMsg) {
  return /\b(next|upcoming|today|tomorrow|my|show me|what do i have|when is|at what time)\b.*\b(meeting|appointment|event|schedule|reminder)\b/.test(
    normalizedMsg
  );
}

export function isConfirmation(normalizedMsg) {
  return /^(yes|y|ok|confirm|sure)$/i.test(normalizedMsg);
}

export function isCancellation(normalizedMsg) {
  return /^(no|n|cancel|stop)$/i.test(normalizedMsg);
}
