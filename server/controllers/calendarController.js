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

// Récupérer le prochain événement à venir
export async function getNextEvent(req, res) {
  try {
    if (!req.user?.googleAccessToken || !req.user?.googleRefreshToken) {
      return res.status(401).json({
        success: false,
        error: "Google Calendar not connected"
      });
    }

    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 7); // Regarder les 7 prochains jours

    const events = await getEventsFromGoogleCalendar(
      req.user.googleAccessToken,
      req.user.googleRefreshToken,
      now.toISOString(),
      endDate.toISOString()
    );

    // Sort events by start time
    const sortedEvents = events
      .filter(event => {
        const eventStart = event.start?.dateTime || event.start?.date;
        return new Date(eventStart) > now; // Keep only future events
      })
      .sort((a, b) => {
        const aStart = a.start?.dateTime || a.start?.date;
        const bStart = b.start?.dateTime || b.start?.date;
        return new Date(aStart) - new Date(bStart);
      });

    const nextEvent = sortedEvents[0]; // First event is the nearest one

    if (!nextEvent) {
      return res.json({
        success: true,
        data: null,
        message: "No upcoming events"
      });
    }

    res.json({
      success: true,
      data: {
        id: nextEvent.id,
        title: nextEvent.summary || 'No title',
        startTime: nextEvent.start?.dateTime || nextEvent.start?.date,
        endTime: nextEvent.end?.dateTime || nextEvent.end?.date,
        location: nextEvent.location,
        description: nextEvent.description
      }
    });
  } catch (error) {
    console.error("Error while fetching next event:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error while fetching next event"
    });
  }
}
