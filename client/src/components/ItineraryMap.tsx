import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  GoogleMap, 
  useJsApiLoader,
  DirectionsService, 
  DirectionsRenderer
} from '@react-google-maps/api';
import '../styles/ItineraryMap.css';

// Google Maps API Key
// Note: In production, move this to an environment variable
const GOOGLE_MAPS_API_KEY = 'AIzaSyCwz3oWql01up5LQWjjfC2bv23RhmUetGk';

interface RouteInfo {
  duration: string;
  distance: string;
}

interface ItineraryMapProps {
  origin: string;
  destination: string;
  height?: string;
  width?: string;
  onRouteInfoChange?: (info: RouteInfo | null) => void;
}

const ItineraryMap: React.FC<ItineraryMapProps> = ({
  origin,
  destination,
  height = '400px',
  width = '100%',
  onRouteInfoChange
}) => {
  const [response, setResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRequest, setLastRequest] = useState<{origin: string, destination: string} | null>(null);

  // Load Google Maps API
  const { isLoaded: isScriptLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
    version: 'weekly',
    preventGoogleFontsLoading: true
  });

  // Update loading state when script is loaded
  useEffect(() => {
    if (isScriptLoaded) {
      setIsLoading(false);
    }
  }, [isScriptLoaded]);

  // Handle directions response
  const directionsCallback = useCallback(
    (
      result: google.maps.DirectionsResult | null,
      status: google.maps.DirectionsStatus
    ) => {
      setIsLoading(false);
      
      if (status === 'OK' && result) {
        setResponse(prev => {
          // Prevent unnecessary state updates
          if (JSON.stringify(prev) === JSON.stringify(result)) return prev;
          return result;
        });
        
        setError(null);
        
        // Extract route information
        if (result.routes?.[0]?.legs?.[0]) {
          const leg = result.routes[0].legs[0];
          const routeInfo = {
            duration: leg.duration?.text || 'N/A',
            distance: leg.distance?.text || 'N/A'
          };
          onRouteInfoChange?.(routeInfo);
        }
      } else if (status !== 'OK') {
        // Only show error if it's not a successful request
        setError(`Failed to calculate route: ${status}`);
        setResponse(null);
        onRouteInfoChange?.(null);
      }
    },
    [onRouteInfoChange]
  );

  // Check if we need to make a new request
  useEffect(() => {
    if (!isScriptLoaded || !origin || !destination) return;
    
    const currentRequest = { origin, destination };
    const isSameAsLastRequest = lastRequest && 
      lastRequest.origin === currentRequest.origin && 
      lastRequest.destination === currentRequest.destination;
    
    if (!isSameAsLastRequest) {
      setLastRequest(currentRequest);
      setResponse(null);
      setIsLoading(true);
    }
  }, [origin, destination, isScriptLoaded, lastRequest]);

  // Memoize styles to prevent unnecessary re-renders
  const containerStyle = useMemo(() => ({
    width,
    height,
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  }), [width, height]);

  // Default center (Paris)
  const center = useMemo(() => ({
    lat: 48.8566,
    lng: 2.3522
  }), []);

  // Show message if origin or destination is missing
  if (!origin || !destination) {
    return (
      <div className="itinerary-map-container" style={{ height }}>
        <div className="no-route-message">
          {!origin ? 'Starting position unknown' : 'No destination specified'}
        </div>
      </div>
    );
  }

  if (!isScriptLoaded) {
    return (
      <div className="itinerary-map-container" style={{ height, width }}>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="itinerary-map-container" style={{ height, width }}>
      {isLoading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Calculating route...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={12}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
              gestureHandling: 'auto',
              clickableIcons: false
            }}
          >
            {isLoading || (lastRequest && lastRequest.origin === origin && lastRequest.destination === destination) ? (
              <DirectionsService
                options={{
                  destination: destination,
                  origin: origin,
                  travelMode: window.google.maps.TravelMode.DRIVING,
                }}
                callback={directionsCallback}
              />
            ) : null}
            {response && (
              <DirectionsRenderer 
                options={{
                  directions: response,
                  suppressMarkers: false,
                  polylineOptions: {
                    strokeColor: '#1976D2',
                    strokeWeight: 5,
                    strokeOpacity: 0.8
                  },
                  markerOptions: {
                    opacity: 0.9,
                    clickable: true
                  }
                }}
              />
            )}
          </GoogleMap>
    </div>
  );
};

export default ItineraryMap;
