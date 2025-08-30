// Geocoding service using Nominatim (OpenStreetMap) API
// Free to use with reasonable rate limits

export interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  formatted: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

class GeocodingService {
  private baseUrl = 'https://nominatim.openstreetmap.org';
  private cache = new Map<string, AddressSuggestion[]>();
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // 1 second between requests (Nominatim rate limit)

  // Search for address suggestions
  async searchAddresses(query: string, countryCode: string = 'us'): Promise<AddressSuggestion[]> {
    if (!query || query.length < 3) {
      return [];
    }

    // Check cache first
    const cacheKey = `${query}-${countryCode}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        countrycodes: countryCode,
        limit: '5',
        'accept-language': 'en'
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          'User-Agent': 'KHS-CRM/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Format the results
      const suggestions: AddressSuggestion[] = data.map((item: any) => ({
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon,
        address: item.address || {},
        formatted: this.formatAddress(item)
      }));

      // Cache the results
      this.cache.set(cacheKey, suggestions);
      
      // Clear old cache entries if too many
      if (this.cache.size > 100) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      return suggestions;
    } catch (error) {
      console.error('Geocoding error:', error);
      return [];
    }
  }

  // Format address from Nominatim response
  private formatAddress(item: any): ParsedAddress {
    const addr = item.address || {};
    
    // Build street address
    const streetParts = [];
    if (addr.house_number) streetParts.push(addr.house_number);
    if (addr.road) streetParts.push(addr.road);
    const street = streetParts.join(' ') || '';

    // Get city (Nominatim uses different fields for different locations)
    const city = addr.city || addr.town || addr.village || addr.hamlet || '';

    // Get state abbreviation
    const state = this.getStateAbbreviation(addr.state || '');

    // Get zip code
    const zip = addr.postcode || '';

    return { street, city, state, zip };
  }

  // Convert state names to abbreviations
  private getStateAbbreviation(stateName: string): string {
    const stateMap: Record<string, string> = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
      'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
      'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
      'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
      'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
      'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
      'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
      'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
      'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
      'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
      'Wisconsin': 'WI', 'Wyoming': 'WY'
    };

    // Check if it's already an abbreviation
    if (stateName.length === 2) {
      return stateName.toUpperCase();
    }

    // Convert full name to abbreviation
    return stateMap[stateName] || stateName.substring(0, 2).toUpperCase();
  }

  // Parse a US address string into components
  parseAddressString(addressString: string): ParsedAddress | null {
    if (!addressString) return null;

    // Try to parse common US address formats
    // Format 1: "123 Main St, Springfield, IL 62701"
    const parts = addressString.split(',').map(p => p.trim());
    
    if (parts.length >= 3) {
      const street = parts[0];
      const city = parts[1];
      const stateZip = parts[2];
      
      // Extract state and zip from last part
      const stateZipMatch = stateZip.match(/([A-Z]{2})\s*(\d{5}(-\d{4})?)?/);
      if (stateZipMatch) {
        return {
          street,
          city,
          state: stateZipMatch[1],
          zip: stateZipMatch[2] || ''
        };
      }
    }

    return null;
  }

  // Clear the cache
  clearCache() {
    this.cache.clear();
  }
}

export const geocodingService = new GeocodingService();