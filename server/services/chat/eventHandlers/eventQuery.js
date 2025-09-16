export async function handleEventQuery() {
  return {
    success: true,
    data: {
      type: "calendar_event_query",
      message: "Here are your upcoming events (fake response for now).",
      events: [
        {
          title: "Team meeting",
          start: "2025-09-17T10:00:00Z",
          end: "2025-09-17T11:00:00Z",
          location: "Zoom",
        },
      ],
    },
  };
}
