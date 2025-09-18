import { useState, useRef, useEffect } from "react";
import "../styles/InputChat.css";
import "../styles/MapSidebar.css";
import TodaysCalendar from "../components/TodaysCalendar.tsx";
import ItineraryMap from "../components/ItineraryMap";
import { FiMapPin, FiClock, FiCalendar } from "react-icons/fi";

interface Message {
  sender: "user" | "bot";
  text: string;
  isHtml?: boolean;
  eventData?: any;
}

interface EventLocation {
  address?: string;
  startTime?: string;
  endTime?: string;
  summary?: string;
}

const InputChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    duration: string;
    distance: string;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [nextEvent, setNextEvent] = useState<EventLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get user's location
  useEffect(() => {
    const getLocation = () => {
      console.log("Attempting to access geolocation...");

      if (!navigator.geolocation) {
        const errorMsg = "Geolocation is not supported by your browser.";
        console.error(errorMsg);
        setLocationError(errorMsg);
        return;
      }

      console.log("Requesting geolocation permission...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Successfully got position:", position);
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          let errorMessage = "Unable to access your location. ";

          console.error(
            "Geolocation error - Code:",
            error.code,
            "Message:",
            error.message
          );

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Location access was denied. ";
              errorMessage +=
                "Please check your browser settings and allow access to your location.";
              console.warn(
                "Make sure you've allowed location access in your browser settings."
              );
              break;

            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable. ";
              errorMessage +=
                "Please check your internet connection and ensure GPS is enabled.";
              break;

            case error.TIMEOUT:
              errorMessage += "The request to get your location timed out. ";
              errorMessage +=
                "Please try again in an area with better GPS reception.";
              break;

            default:
              errorMessage += "Unknown error: " + error.message;
          }

          console.error("Error details:", {
            code: error.code,
            message: error.message,
            timestamp: new Date().toISOString(),
          });

          setLocationError(errorMessage);
        },
        {
          enableHighAccuracy: true, // Try to use GPS if available
          timeout: 15000, // Increase timeout to 15 seconds
          maximumAge: 0, // Always get a fresh position
        }
      );
    };

    // Try to get location immediately
    getLocation();

    // If first attempt fails, retry after 5 seconds
    const retryTimer = setTimeout(() => {
      if (!userLocation) {
        console.log("Retrieving location (2nd attempt)...");
        getLocation();
      }
    }, 5000);

    return () => clearTimeout(retryTimer);
  }, []);

  // Fetch next calendar event
  useEffect(() => {
    const fetchNextEvent = async () => {
      try {
        const response = await fetch("http://localhost:3000/calendar/next", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          setNextEvent({
            address: data.data.location || "",
            startTime: data.data.startTime,
            endTime: data.data.endTime,
            summary: data.data.title,
          });
        } else {
          setNextEvent(null);
          console.log("No upcoming events found");
        }
      } catch (error) {
        console.error("Error while fetching next event:", error);
        setLocationError((prev) => prev || "Failed to load next event");
      }
    };

    fetchNextEvent();

    // Refresh every 5 minutes
    const interval = setInterval(fetchNextEvent, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // 🔹 Focus automatique sur le champ de saisie au chargement
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  // 🔹 Scroll automatique en bas du chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatEventDetails = (event: any): string => {
    if (!event) return "No event details available";
    let details = "";
    if (event.title) details += `Title: ${event.title}\n`;
    if (event.start)
      details += `Start: ${new Date(event.start).toLocaleString()}\n`;
    if (event.end) details += `End: ${new Date(event.end).toLocaleString()}\n`;
    if (event.location) details += `Location: ${event.location}\n`;
    if (event.description) details += `${event.description}\n`;
    return details;
  };

  const handleSend = async () => {
    const trimmedMessage = input.trim();
    if (!trimmedMessage || isLoading) return;

    const userMessage: Message = { sender: "user", text: trimmedMessage };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://aisecretary-kchy.onrender.com/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message: trimmedMessage }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        let botMessage: Message;

        switch (data.data.type) {
          case "calendar_event":
            botMessage = {
              sender: "bot",
              text: `${data.data.message}\n\n${formatEventDetails(
                data.data.event
              )}`,
              eventData: data.data.event,
            };
            break;

          case "calendar_query":
            const eventsText = data.data.events
              .map(
                (evt: any, idx: number) =>
                  `Event ${idx + 1}:\n${formatEventDetails(evt)}`
              )
              .join("\n");
            botMessage = {
              sender: "bot",
              text: `${data.data.message}\n\n${eventsText}`,
            };
            break;

          default:
            botMessage = { sender: "bot", text: data.data.message };
        }

        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(data.error || "Unexpected server response");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `Sorry, an error occurred: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="main-container">
      <div className="calendar-sidebar">
        <TodaysCalendar />
      </div>

      <div className="chat-container">
        <h2>AI Assistant</h2>
        <div className="chat-history" ref={bottomRef}>
          {messages.map((msg: Message, index: number) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-content">
                {msg.isHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="chat-input">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading}
            autoFocus
          />
          <button onClick={handleSend} disabled={!input.trim() || isLoading}>
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      <div className="map-sidebar">
        <h3>Directions to Your Next Appointment</h3>
        {locationError ? (
          <div className="map-error">
            <h4>Location Error</h4>
            <p>{locationError}</p>
            <div className="error-instructions">
              <p>To fix this issue:</p>
              <ol>
                <li>
                  Check that your browser has permission to access your location
                </li>
                <li>Make sure your GPS is enabled</li>
                <li>Refresh the page and accept the permission request</li>
                <li>
                  Check your browser's site settings if the permission prompt
                  doesn't appear
                </li>
              </ol>
            </div>
          </div>
        ) : null}
        {nextEvent ? (
          <>
            <div className="event-details">
              <h4>
                <FiCalendar /> {nextEvent.summary || "Appointment"}
              </h4>
              {nextEvent.address && (
                <p>
                  <FiMapPin /> {nextEvent.address}
                </p>
              )}
              {nextEvent.startTime && (
                <p>
                  <FiClock />{" "}
                  {new Date(nextEvent.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {nextEvent.endTime &&
                    ` - ${new Date(nextEvent.endTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`}
                </p>
              )}
            </div>
            <div className="map-wrapper">
              <div className="map-container">
                {userLocation && nextEvent.address ? (
                  <ItineraryMap
                    origin={`${userLocation.lat},${userLocation.lng}`}
                    destination={nextEvent.address}
                    onRouteInfoChange={setRouteInfo}
                  />
                ) : (
                  <div className="no-route-message">
                    {!userLocation
                      ? "Position actuelle inconnue"
                      : "Aucune destination spécifiée"}
                  </div>
                )}
              </div>
              {routeInfo && (
                <div className="route-info">
                  <div className="route-info-item">
                    <FiClock />
                    <span>{routeInfo.duration}</span>
                  </div>
                  <div className="route-info-item">
                    <FiMapPin />
                    <span>{routeInfo.distance}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="no-event">
            <p>No upcoming events</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputChat;
