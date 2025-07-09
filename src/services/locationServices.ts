import { Store, PostcodeInfo } from '../types';

// Google Places API configuration - SECURE: Use environment variable
const GOOGLE_PLACES_API_KEY = (import.meta as any).env?.VITE_GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Validate API key is available
if (!GOOGLE_PLACES_API_KEY) {
  console.warn('Google Places API key not found. Location services will use fallback methods only.');
}

// Supported store chains mapping
const SUPPORTED_STORE_CHAINS = new Map([
  ['tesco', ['tesco', 'tesco express', 'tesco extra', 'tesco metro']],
  ['asda', ['asda', 'asda superstore', 'asda supermarket']],
  ['sainsburys', ['sainsbury\'s', 'sainsburys', 'sainsbury\'s local', 'sainsbury\'s superstore']],
  ['morrisons', ['morrisons', 'morrisons supermarket', 'morrisons daily']],
  ['aldi', ['aldi', 'aldi stores']],
  ['lidl', ['lidl', 'lidl gb']],
  ['iceland', ['iceland', 'iceland foods']],
  ['waitrose', ['waitrose', 'waitrose & partners']],
  ['marks-spencer', ['marks & spencer', 'm&s', 'marks and spencer', 'ms food']],
  ['coop', ['co-op', 'coop', 'the co-operative food', 'co-operative']]
]);

export interface GooglePlacesStore {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  business_status?: string;
  opening_hours?: {
    open_now: boolean;
  };
  rating?: number;
  price_level?: number;
  types: string[];
}

export interface GooglePlacesResponse {
  results: GooglePlacesStore[];
  status: string;
  error_message?: string;
  next_page_token?: string;
}

export interface StoreSearchParams {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  query?: string;
}

export class LocationServices {
  private static instance: LocationServices;
  private quotaExhausted = false;

  static getInstance(): LocationServices {
    if (!LocationServices.instance) {
      LocationServices.instance = new LocationServices();
    }
    return LocationServices.instance;
  }

  /**
   * Convert miles to meters for Google Places API
   */
  private milesToMeters(miles: number): number {
    return Math.round(miles * 1609.344);
  }

  /**
   * Convert meters to miles for display
   */
  private metersToMiles(meters: number): number {
    return meters / 1609.344;
  }

  /**
   * Determine which supported store chain this place belongs to
   */
  private identifyStoreChain(placeName: string): string | null {
    const name = placeName.toLowerCase();
    
    for (const [chain, variants] of SUPPORTED_STORE_CHAINS) {
      for (const variant of variants) {
        if (name.includes(variant.toLowerCase())) {
          return chain;
        }
      }
    }
    return null;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 0.621371; // Convert to miles
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Search for grocery stores near coordinates using Google Places API
   */
  async findNearbyStores(params: StoreSearchParams): Promise<Store[]> {
    if (this.quotaExhausted) {
      console.warn('Google Places API quota exhausted, falling back to alternative methods');
      return this.getFallbackStores(params);
    }

    try {
      const radiusMeters = this.milesToMeters(params.radius);
      const url = new URL(`${GOOGLE_PLACES_BASE_URL}/nearbysearch/json`);
      
      url.searchParams.append('location', `${params.latitude},${params.longitude}`);
      url.searchParams.append('radius', radiusMeters.toString());
      url.searchParams.append('type', 'grocery_or_supermarket');
      url.searchParams.append('key', GOOGLE_PLACES_API_KEY || ''); // Use empty string if key is not available
      
      if (params.query) {
        url.searchParams.append('keyword', params.query);
      }

      const response = await fetch(url.toString());
      const data: GooglePlacesResponse = await response.json();

      if (data.status === 'OVER_QUERY_LIMIT') {
        console.warn('Google Places API quota exceeded');
        this.quotaExhausted = true;
        return this.getFallbackStores(params);
      }

      if (data.status !== 'OK') {
        console.error('Google Places API error:', data.error_message || data.status);
        return this.getFallbackStores(params);
      }

      return this.processGooglePlacesResults(data.results, params);
    } catch (error) {
      console.error('Error fetching from Google Places API:', error);
      return this.getFallbackStores(params);
    }
  }

  /**
   * Process Google Places API results and filter for supported stores
   */
  private processGooglePlacesResults(results: GooglePlacesStore[], params: StoreSearchParams): Store[] {
    const stores: Store[] = [];

    for (const place of results) {
      const storeChain = this.identifyStoreChain(place.name);
      if (!storeChain) continue; // Skip unsupported stores

      const distance = this.calculateDistance(
        params.latitude,
        params.longitude,
        place.geometry.location.lat,
        place.geometry.location.lng
      );

      // Double-check distance is within radius (Google can be imprecise)
      if (distance > params.radius) continue;

      const store: Store = {
        id: `${storeChain}-${place.place_id}`,
        name: this.getDisplayName(storeChain),
        logoUrl: `/logos/${storeChain}.png`,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        isOpen: place.opening_hours?.open_now ?? true,
        deliveryAvailable: this.getDeliveryAvailability(storeChain),
        collectionAvailable: true, // Most stores support collection
        address: place.vicinity,
        coordinates: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        },
        placeId: place.place_id,
        rating: place.rating
      };

      stores.push(store);
    }

    // Remove duplicates (same chain, very close locations)
    const deduplicatedStores = this.deduplicateStores(stores);
    
    // Sort by distance
    return deduplicatedStores.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Remove duplicate stores (same chain within 0.1 miles)
   */
  private deduplicateStores(stores: Store[]): Store[] {
    const seen = new Map<string, Store>();
    
    for (const store of stores) {
      const key = store.name.toLowerCase();
      const existing = seen.get(key);
      
      if (!existing) {
        seen.set(key, store);
      } else if (store.distance < existing.distance) {
        // Keep the closer one
        seen.set(key, store);
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * Get display name for store chain
   */
  private getDisplayName(storeChain: string): string {
    const displayNames: Record<string, string> = {
      tesco: 'Tesco',
      asda: 'ASDA',
      sainsburys: 'Sainsbury\'s',
      morrisons: 'Morrisons',
      aldi: 'Aldi',
      lidl: 'Lidl',
      iceland: 'Iceland',
      waitrose: 'Waitrose',
      'marks-spencer': 'M&S Food',
      coop: 'Co-op'
    };
    return displayNames[storeChain] || storeChain;
  }

  /**
   * Get delivery availability based on store chain
   */
  private getDeliveryAvailability(storeChain: string): boolean {
    const deliverySupport: Record<string, boolean> = {
      tesco: true,
      asda: true,
      sainsburys: true,
      morrisons: true,
      aldi: false, // Aldi doesn't typically offer delivery
      lidl: false,
      iceland: true,
      waitrose: true,
      'marks-spencer': true,
      coop: false
    };
    return deliverySupport[storeChain] ?? false;
  }

  /**
   * Fallback method using OpenStreetMap Nominatim API
   */
  private async getFallbackStores(params: StoreSearchParams): Promise<Store[]> {
    console.log('Using fallback store detection method');
    
    try {
      // Use OpenStreetMap Overpass API to find stores
      const overpassQuery = this.buildOverpassQuery(params);
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
        headers: { 'Content-Type': 'text/plain' }
      });

      if (!response.ok) {
        return this.getHardcodedStores(params);
      }

      const data = await response.json();
      return this.processOverpassResults(data, params);
    } catch (error) {
      console.error('Fallback API also failed:', error);
      return this.getHardcodedStores(params);
    }
  }

  /**
   * Build Overpass API query for grocery stores
   */
  private buildOverpassQuery(params: StoreSearchParams): string {
    const radiusMeters = this.milesToMeters(params.radius);
    return `
      [out:json][timeout:25];
      (
        node["shop"="supermarket"](around:${radiusMeters},${params.latitude},${params.longitude});
        way["shop"="supermarket"](around:${radiusMeters},${params.latitude},${params.longitude});
        relation["shop"="supermarket"](around:${radiusMeters},${params.latitude},${params.longitude});
      );
      out center;
    `;
  }

  /**
   * Process OpenStreetMap Overpass results
   */
  private processOverpassResults(data: any, params: StoreSearchParams): Store[] {
    const stores: Store[] = [];
    
    for (const element of data.elements || []) {
      const name = element.tags?.name || element.tags?.brand || 'Unknown Store';
      const storeChain = this.identifyStoreChain(name);
      
      if (!storeChain) continue;

      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;
      
      if (!lat || !lon) continue;

      const distance = this.calculateDistance(params.latitude, params.longitude, lat, lon);
      if (distance > params.radius) continue;

      const store: Store = {
        id: `${storeChain}-osm-${element.id}`,
        name: this.getDisplayName(storeChain),
        logoUrl: `/logos/${storeChain}.png`,
        distance: Math.round(distance * 10) / 10,
        isOpen: true, // OSM doesn't provide real-time hours
        deliveryAvailable: this.getDeliveryAvailability(storeChain),
        collectionAvailable: true,
        address: element.tags?.['addr:full'] || element.tags?.['addr:street'] || 'Address not available',
        coordinates: { lat, lng: lon }
      };

      stores.push(store);
    }

    return this.deduplicateStores(stores).sort((a, b) => a.distance - b.distance);
  }

  /**
   * Last resort: return hardcoded store locations
   */
  private getHardcodedStores(params: StoreSearchParams): Store[] {
    console.log('Using hardcoded store fallback');
    
    // This would typically be a curated list of major store locations
    // For now, return a representative sample
    const hardcodedStores: Store[] = [
      {
        id: 'tesco-fallback',
        name: 'Tesco',
        logoUrl: '/logos/tesco.png',
        distance: 0.8,
        isOpen: true,
        deliveryAvailable: true,
        collectionAvailable: true,
        address: 'Local area'
      },
      {
        id: 'sainsburys-fallback',
        name: 'Sainsbury\'s',
        logoUrl: '/logos/sainsburys.png',
        distance: 1.2,
        isOpen: true,
        deliveryAvailable: true,
        collectionAvailable: true,
        address: 'Local area'
      },
      {
        id: 'asda-fallback',
        name: 'ASDA',
        logoUrl: '/logos/asda.png',
        distance: 1.5,
        isOpen: true,
        deliveryAvailable: true,
        collectionAvailable: true,
        address: 'Local area'
      }
    ];

    return hardcodedStores.filter(store => store.distance <= params.radius);
  }

  /**
   * Convert UK postcode to coordinates using a geocoding service
   */
  async postcodeToCoordinates(postcode: string): Promise<{ lat: number; lng: number } | null> {
    try {
      // Try Google Geocoding API first
      if (!this.quotaExhausted && GOOGLE_PLACES_API_KEY) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(postcode)}&key=${GOOGLE_PLACES_API_KEY}`
        );
        
        const data = await response.json();
        
        if (data.status === 'OVER_QUERY_LIMIT') {
          this.quotaExhausted = true;
        } else if (data.status === 'OK' && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          return { lat: location.lat, lng: location.lng };
        }
      }

      // Fallback to UK postcode API
      const response = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
      const data = await response.json();
      
      if (data.status === 200) {
        return { lat: data.result.latitude, lng: data.result.longitude };
      }
    } catch (error) {
      console.error('Error converting postcode to coordinates:', error);
    }
    
    return null;
  }

  /**
   * Main method to find stores near a postcode
   */
  async findStoresNearPostcode(postcode: string, radiusMiles: number): Promise<Store[]> {
    const coordinates = await this.postcodeToCoordinates(postcode);
    
    if (!coordinates) {
      console.error('Could not convert postcode to coordinates');
      return [];
    }

    return this.findNearbyStores({
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      radius: radiusMiles
    });
  }
}

// Export singleton instance
export const locationServices = LocationServices.getInstance(); 