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

// SDK loading state
let sdkLoadPromise: Promise<void> | null = null;

/**
 * Ensure the Mappls SDK is loaded via CDN
 */
async function ensureMapplsSdkLoaded(): Promise<boolean> {
    // Already loaded
    if (window.mappls && window.mappls.rev_geocode) {
        return true;
    }

    // Already loading
    if (sdkLoadPromise) {
        await sdkLoadPromise;
        return !!(window.mappls && window.mappls.rev_geocode);
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('No Mappls API key configured');
        return false;
    }

    sdkLoadPromise = new Promise((resolve) => {
        // Check if script already exists
        if (document.querySelector('script[src*="api.mappls.com"]')) {
            // Wait for it to load
            const checkLoaded = () => {
                if (window.mappls && window.mappls.rev_geocode) {
                    resolve();
                } else {
                    setTimeout(checkLoaded, 100);
                }
            };
            checkLoaded();
            return;
        }

        // Create and inject script
        const script = document.createElement('script');
        script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=3.0&callback=mapplsCallback`;
        script.async = true;

        // Create callback
        (window as any).mapplsCallback = () => {
            resolve();
        };

        script.onerror = () => {
            console.error('Failed to load Mappls SDK');
            resolve();
        };

        document.head.appendChild(script);

        // Timeout fallback
        setTimeout(() => {
            if (!window.mappls) {
                console.error('Mappls SDK load timed out');
            }
            resolve();
        }, 10000);
    });

    await sdkLoadPromise;
    return !!(window.mappls && window.mappls.rev_geocode);
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
 * Structured address result from reverse geocode
 */
export interface StructuredAddress {
    addressLine1: string;
    addressLine2: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    formatted: string;
}

/**
 * Reverse geocode coordinates and return structured address components
 * Uses the correct Mappls search API endpoint
 */
export async function reverseGeocodeStructured(lat: number, lng: number): Promise<StructuredAddress | null> {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('No API key configured');
        return null;
    }

    try {
        // Use the correct reverse geocode endpoint
        const url = `https://search.mappls.com/search/address/rev-geocode?lat=${lat}&lng=${lng}&access_token=${apiKey}`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error('Reverse geocode API error:', response.status, response.statusText);
            return null;
        }

        const data = await response.json();

        // Parse the response - handle different possible formats
        let result: any = null;
        if (data && Array.isArray(data) && data.length > 0) {
            result = data[0];
        } else if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
            result = data.results[0];
        } else if (data && typeof data === 'object' && !Array.isArray(data)) {
            result = data;
        }

        if (result) {
            // Parse address: Line 1 = house number/name + street, Line 2 = locality/village
            const houseNumber = result.houseNumber || '';
            const houseName = result.houseName || '';
            const street = result.street && result.street !== 'Unnamed Road' ? result.street : '';
            const locality = result.locality || '';
            const subLocality = result.subLocality || '';
            const village = result.village || '';
            const subDistrict = result.subDistrict || '';

            // Address Line 1: House number, house name, street (comma-separated)
            const addressLine1 = [houseNumber, houseName, street].filter(Boolean).join(', ');

            // Address Line 2: Locality (urban) or Village (rural - subDistrict goes to city)
            let addressLine2 = '';
            if (locality || subLocality) {
                addressLine2 = [subLocality, locality].filter(Boolean).join(', ');
            } else if (village) {
                addressLine2 = village;
            }

            // City: subDistrict for rural areas, city for urban
            const isRural = !result.city && (village || subDistrict);
            const city = isRural ? (subDistrict || '') : (result.city || '');
            const district = result.district || '';
            const state = result.state || '';
            const pincode = result.pincode || '';
            const formatted = result.formatted_address ||
                [addressLine1, addressLine2, city, district, state, pincode].filter(Boolean).join(', ');

            return {
                addressLine1: addressLine1 || formatted.split(',')[0]?.trim() || '',
                addressLine2,
                city,
                district,
                state,
                pincode,
                formatted
            };
        }

        console.error('No result in reverse geocode response');
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

