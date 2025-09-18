import { getEventsFromGoogleCalendar } from "../services/eventServices.js";

export async function getEventsByDate(req, res) {
  try {
    if (!req.user?.googleAccessToken || !req.user?.googleRefreshToken) {
      return res.status(401).json({
        success: false,
        error: "Google Calendar not connected"
      });
    }

    let date;
    if (req.params.date) {
      // Si une date est fournie dans l'URL, on l'utilise
      date = new Date(req.params.date);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Invalid date format. Use YYYY-MM-DD"
        });
      }
    } else {
      // Sinon, on utilise la date d'aujourd'hui
      date = new Date();
    }

    // Définir le début et la fin de la journée
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const events = await getEventsFromGoogleCalendar(
      req.user.googleAccessToken,
      req.user.googleRefreshToken,
      start,
      end
    );

    res.json({
      success: true,
      data: events.map(event => ({
        id: event.id,
        title: event.summary || 'No title',
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        location: event.location,
        description: event.description
      }))
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch events"
    });
  }
}

// Fonction de compatibilité pour l'ancienne route
export async function getTodaysEvents(req, res) {
  req.params = {}; // S'assurer que req.params existe
  return getEventsByDate(req, res);
}
