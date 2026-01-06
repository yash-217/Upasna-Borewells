// Mappls API Service - Uses static API key for autosuggest
// API key is passed as access_token query parameter

interface AutosuggestResult {
    placeName: string;
    placeAddress: string;
    latitude: number;
    longitude: number;
    eLoc?: string;
}

/**
 * Get the static API key from environment
 */
function getApiKey(): string | null {
    let apiKey = import.meta.env.VITE_MAPPLS_API_KEY;
    if (apiKey && apiKey.startsWith('VITE_MAPPLS_API_KEY=')) {
        apiKey = apiKey.replace('VITE_MAPPLS_API_KEY=', '');
    }
    return apiKey || null;
}

/**
 * Search for places using Mappls Autosuggest API with static API key
 */
export async function searchPlaces(query: string): Promise<AutosuggestResult[]> {
    if (!query || query.length < 3) {
        return [];
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        console.warn('Mappls API key not configured');
        return [];
    }

    try {
        // Use static API key as access_token query parameter
        const url = `https://atlas.mappls.com/api/places/search/json?query=${encodeURIComponent(query)}&access_token=${apiKey}&region=IND`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error('Autosuggest API error:', response.status);
            return [];
        }

        const data = await response.json();

        // Handle different response formats
        if (data.suggestedLocations && Array.isArray(data.suggestedLocations)) {
            return data.suggestedLocations.slice(0, 6);
        } else if (Array.isArray(data)) {
            return data.slice(0, 6);
        }

        return [];
    } catch (error) {
        console.error('Autosuggest error:', error);
        return [];
    }
}

/**
 * Reverse geocode coordinates to get address using static API key
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const apiKey = getApiKey();
    if (!apiKey) {
        return null;
    }

    try {
        const url = `https://apis.mappls.com/advancedmaps/v1/${apiKey}/rev_geocode?lat=${lat}&lng=${lng}`;

        const response = await fetch(url);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            return data.results[0].formatted_address || null;
        }

        return null;
    } catch (error) {
        console.error('Reverse geocode error:', error);
        return null;
    }
}

/**
 * Check if API key is configured (for fallback logic)
 */
export function hasApiKey(): boolean {
    return !!getApiKey();
}
