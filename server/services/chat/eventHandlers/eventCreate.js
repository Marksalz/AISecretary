import { addEventToGoogleCalendar } from "../../../services/eventServices.js";
import { createChatResponse } from "../responseHandler.js";

export default async function createEvent(
  data,
  googleAccessToken,
  googleRefreshToken
) {
  try {
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
