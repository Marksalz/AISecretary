import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import '../styles/ItineraryMap.css';

// Google Maps API Key
// Note: In production, move this to an environment variable
const GOOGLE_MAPS_API_KEY = 'AIzaSyCwz3oWql01up5LQWjjfC2bv23RhmUetGk';

// Type for directions status
type DirectionsStatus = 'OK' | 'NOT_FOUND' | 'ZERO_RESULTS' | 'MAX_WAYPOINTS_EXCEEDED' | 'INVALID_REQUEST' | 'OVER_DAILY_LIMIT' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'UNKNOWN_ERROR';

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
  height = '100%',
  width = '100%',
  onRouteInfoChange
}) => {
  const [response, setResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if Google Maps script is loaded
  useEffect(() => {
    if (window.google?.maps) {
      setIsScriptLoaded(true);
      setIsLoading(false);
    }
  }, []);

  // Handle directions response
  const directionsCallback = useCallback(
    (
      result: google.maps.DirectionsResult | null,
      status: google.maps.DirectionsStatus
    ) => {
      setIsLoading(false);
      
      if (status === 'OK' && result) {
        setResponse(result);
        setError(null);
        
        // Extract route information
        if (result.routes && result.routes[0] && result.routes[0].legs && result.routes[0].legs[0]) {
          const leg = result.routes[0].legs[0];
          const routeInfo = {
            duration: leg.duration?.text || 'N/A',
            distance: leg.distance?.text || 'N/A'
          };
          onRouteInfoChange?.(routeInfo);
        }
      } else {
        setError(`Failed to calculate route: ${status}`);
        setResponse(null);
        onRouteInfoChange?.(null);
      }
    },
    [onRouteInfoChange]
  );

  // Container style for the map
  const containerStyle = {
    width,
    height,
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  };

  // Default center (Paris)
  const center = {
    lat: 48.8566,
    lng: 2.3522
  };

  // Show message if origin or destination is missing
  if (!origin || !destination) {
    return (
      <div className="no-route-message">
        {!origin ? 'Starting position unknown' : 'No destination specified'}
      </div>
    );
  }

  return (
    <div className="map-container">
      {isLoading && (
        <div className="loading-container">
          Loading map...
        </div>
      )}
      
      <LoadScript 
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        onLoad={() => {
          setIsScriptLoaded(true);
          setIsLoading(false);
        }}
        onError={() => {
          setError('Failed to load Google Maps');
          setIsLoading(false);
        }}
      >
        {isScriptLoaded && (
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
            }}
          >
            {origin && destination && (
              <>
                <DirectionsService
                  options={{
                    destination: destination,
                    origin: origin,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                  }}
                  callback={directionsCallback}
                />
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
              </>
            )}
          </GoogleMap>
        )}
      </LoadScript>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default ItineraryMap;
