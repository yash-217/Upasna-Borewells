// Mappls SDK Type Definitions
// Extends the types from mappls-web-maps package

// Re-export types from mappls-web-maps
export { mappls, mappls_plugin } from 'mappls-web-maps';

declare global {
  interface Window {
    mappls?: {
      Map: new (element: string | HTMLElement, options?: MapOptions) => MapInstance;
      Marker: new (options: MarkerOptions) => MarkerInstance;
      search: new (options: SearchOptions, callback: (data: SearchResult) => void) => void;
      rev_geocode: (coords: { lat: number; lng: number }, callback: (data: ReverseGeocodeResult | any[]) => void) => void;
    };
    geoAnalytics?: any;
  }
}

interface MapOptions {
  center?: { lat: number; lng: number } | [number, number];
  zoom?: number;
  zoomControl?: boolean;
  scrollWheel?: boolean;
  draggable?: boolean;
  clickableIcons?: boolean;
  location?: boolean;
  [key: string]: unknown;
}

interface MapInstance {
  setCenter: (center: { lat: number; lng: number } | [number, number]) => void;
  setZoom: (zoom: number) => void;
  getCenter: () => { lat: number; lng: number };
  addListener: (event: string, callback: (e: MapEvent) => void) => void;
  removeListener: (event: string) => void;
  remove: () => void;
}

interface MarkerOptions {
  map: MapInstance;
  position: { lat: number; lng: number };
  draggable?: boolean;
  [key: string]: unknown;
}

interface MarkerInstance {
  setPosition: (position: { lat: number; lng: number }) => void;
  getPosition: () => { lat: number; lng: number };
  addListener: (event: string, callback: (e: MarkerEvent) => void) => void;
  remove: () => void;
}

interface MapEvent {
  lngLat?: { lat: number; lng: number };
  [key: string]: unknown;
}

interface MarkerEvent {
  target?: {
    getPosition: () => { lat: number; lng: number };
  };
  [key: string]: unknown;
}

interface SearchOptions {
  q?: string;
  query?: string;
  pod?: string;
  region?: string;
  location?: string;
  [key: string]: unknown;
}

interface SearchResult {
  suggestedLocations?: SearchSuggestion[];
  places?: SearchSuggestion[];
  [key: string]: unknown;
}

interface SearchSuggestion {
  placeName?: string;
  placeAddress?: string;
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lng?: number | string;
  eLoc?: string;
  entryLatitude?: number | string;
  entryLongitude?: number | string;
  [key: string]: unknown;
}

interface ReverseGeocodeResult {
  results?: Array<{
    formatted_address?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export type {
  MapOptions,
  MapInstance,
  MarkerOptions,
  MarkerInstance,
  MapEvent,
  MarkerEvent,
  SearchOptions,
  SearchResult,
  SearchSuggestion,
  ReverseGeocodeResult
};
