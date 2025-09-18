import { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/TodaysCalendar.css';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface CalendarEvent {
  id?: string;
  title: string;
  start: string;
  end?: string;
  location?: string;
  description?: string;
}

const TodaysCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const dateStr = currentDate.toISOString().split('T')[0];
        const response = await axios.get(`http://localhost:3000/calendar/date/${dateStr}`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setEvents(response.data.data || []);
        } else {
          setError(response.data.error || 'Failed to load events');
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to connect to the server');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentDate]);

  const changeDate = (days: number): void => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const resetToToday = () => {
    setCurrentDate(new Date());
  };

  const formatTime = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const getDayName = (date: Date | string, short: boolean = false): string => {
    const dateObj = date instanceof Date ? date : new Date(date || new Date());
    const options: Intl.DateTimeFormatOptions = short 
      ? { 
          weekday: 'short' as const, 
          month: 'short' as const, 
          day: 'numeric' as const 
        }
      : { 
          weekday: 'long' as const,
          month: 'long' as const,
          day: 'numeric' as const,
          year: 'numeric' as const
        };
    return dateObj.toLocaleDateString('en-US', options);
  };

  if (loading) {
    return <div className="loading">Loading today's schedule...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const isToday = currentDate.toDateString() === new Date().toDateString();

  return (
    <div className="todays-calendar">
      <div className="calendar-header">
        <h3>{isToday ? "Today's" : getDayName(currentDate)} Schedule</h3>
        <div className="date-navigation">
          <button 
            className="nav-arrow" 
            onClick={() => changeDate(-1)}
            aria-label="Previous day"
          >
            <FiChevronLeft size={20} />
          </button>
          
          <button 
            className={`today-button ${isToday ? 'active' : ''}`}
            onClick={resetToToday}
          >
            {isToday ? 'Today' : getDayName(currentDate, true)}
          </button>
          
          <button 
            className="nav-arrow" 
            onClick={() => changeDate(1)}
            aria-label="Next day"
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div className="events-list">
        {events.length > 0 ? (
          events.map((event, index) => (
            <div key={event.id || index} className="event-item">
              <div className="event-time">
                {formatTime(event.start)}
                {event.end && ` - ${formatTime(event.end)}`}
              </div>
              <div className="event-details">
                <div className="event-title">{event.title}</div>
                {event.location && (
                  <div className="event-location">📍 {event.location}</div>
                )}
                {event.description && (
                  <div className="event-description">{event.description}</div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-events">No events scheduled for today</div>
        )}
      </div>
    </div>
  );
};

export default TodaysCalendar;
