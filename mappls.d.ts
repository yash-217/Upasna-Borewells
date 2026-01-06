// Mappls SDK Type Definitions
// See: https://www.mappls.com/api/web-sdk/vector-map-v2

declare global {
  interface Window {
    mappls?: MapplsSDK;
  }
}

interface MapplsSDK {
  Map: new (element: HTMLElement, options: MapOptions) => MapInstance;
  Marker: new (options: MarkerOptions) => MarkerInstance;
  search: new (options: SearchOptions, callback: (data: SearchResult) => void) => void;
  rev_geocode: (coords: { lat: number; lng: number }, callback: (data: ReverseGeocodeResult) => void) => void;
}

interface MapOptions {
  center?: [number, number];
  zoom?: number;
  zoomControl?: boolean;
  location?: boolean;
  [key: string]: unknown;
}

interface MapInstance {
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  addListener: (event: string, callback: (e: MapEvent) => void) => void;
  removeListener: (event: string) => void;
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
  addListener: (event: string, callback: (e: MapEvent) => void) => void;
  remove: () => void;
}

interface MapEvent {
  lngLat?: { lat: number; lng: number };
  [key: string]: unknown;
}

interface SearchOptions {
  q?: string;
  query?: string;
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
  latitude?: number;
  longitude?: number;
  eLoc?: string;
  [key: string]: unknown;
}

interface ReverseGeocodeResult {
  results?: Array<{
    formatted_address?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export { };
