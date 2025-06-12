import type { ComparisonResult } from "@shared/schema";

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  price_level?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  website?: string;
  formatted_phone_number?: string;
  types: string[];
  business_status: string;
}

interface PlacesSearchResponse {
  results: GooglePlace[];
  status: string;
}

export async function searchLocalBusinesses(query: string, location: string): Promise<ComparisonResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    throw new Error("Google Places API key not available");
  }

  try {
    // Text search for businesses
    const searchQuery = `${query} in ${location}`;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
    
    const response = await fetch(searchUrl);
    const data: PlacesSearchResponse = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      if (data.status === 'REQUEST_DENIED') {
        throw new Error(`Google Places API access denied. Please ensure the API key has Places API enabled and proper billing configured in Google Cloud Console.`);
      }
      throw new Error(`Google Places API error: ${data.status}`);
    }

    if (data.results.length === 0) {
      return [];
    }

    // Get detailed information for top 3 results
    const topResults = data.results.slice(0, 3);
    const detailedResults: ComparisonResult[] = [];

    for (const place of topResults) {
      try {
        const details = await getPlaceDetails(place.place_id, apiKey);
        const comparisonResult = formatAsComparisonResult(details);
        detailedResults.push(comparisonResult);
      } catch (error) {
        console.log(`Error getting details for place ${place.place_id}:`, error);
        // Use basic info if detailed fetch fails
        const basicResult = formatAsComparisonResult(place);
        detailedResults.push(basicResult);
      }
    }

    return detailedResults;
  } catch (error) {
    console.error('Google Places API error:', error);
    throw error;
  }
}

async function getPlaceDetails(placeId: string, apiKey: string): Promise<GooglePlace> {
  const fields = 'place_id,name,formatted_address,rating,price_level,opening_hours,website,formatted_phone_number,types,business_status';
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
  
  const response = await fetch(detailsUrl);
  const data = await response.json();
  
  if (data.status !== 'OK') {
    throw new Error(`Place details error: ${data.status}`);
  }
  
  return data.result;
}

function formatAsComparisonResult(place: GooglePlace): ComparisonResult {
  const priceLevel = place.price_level || 2;
  const pricingMap = {
    1: "$",
    2: "$$", 
    3: "$$$",
    4: "$$$$"
  };

  // Determine business type and features
  const isRestaurant = place.types.includes('restaurant') || place.types.includes('food');
  const isCoffeeShop = place.types.includes('cafe') || place.name.toLowerCase().includes('coffee') || place.name.toLowerCase().includes('cafe');
  
  const features: Record<string, boolean | string> = {
    "Address": place.formatted_address || "Address not available",
    "Price Range": pricingMap[priceLevel as keyof typeof pricingMap] || "$$",
    "Currently Open": place.opening_hours?.open_now ? "Yes" : "No",
    "Phone Number": place.formatted_phone_number || "Not available",
    "Business Status": place.business_status === 'OPERATIONAL' ? "Open" : "Status unknown"
  };

  if (isCoffeeShop) {
    features["Specialties"] = "Coffee & beverages";
    features["Atmosphere"] = "Cafe environment";
  } else if (isRestaurant) {
    features["Cuisine"] = "Various dishes";
    features["Dining Experience"] = "Restaurant experience";
  }

  if (place.opening_hours?.weekday_text) {
    features["Operating Hours"] = place.opening_hours.weekday_text[0] || "Hours not available";
  }

  // Generate appropriate badge
  let badge = "Local Business";
  let badgeColor = "blue";
  
  if (place.rating && place.rating >= 4.5) {
    badge = "Highly Rated";
    badgeColor = "green";
  } else if (place.rating && place.rating >= 4.0) {
    badge = "Well Rated";
    badgeColor = "blue";
  } else if (priceLevel === 1) {
    badge = "Budget Friendly";
    badgeColor = "orange";
  } else if (priceLevel === 4) {
    badge = "Premium";
    badgeColor = "purple";
  }

  return {
    name: place.name,
    description: `Located at ${place.formatted_address}`,
    pricing: pricingMap[priceLevel as keyof typeof pricingMap] || "$$",
    rating: null, // We don't display ratings to maintain consistency
    website: place.website || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    logoUrl: null,
    features,
    badge,
    badgeColor
  };
}

export function getLocalBusinessFeatures(businessType: string): string[] {
  const commonFeatures = ["Address", "Price Range", "Currently Open", "Phone Number", "Business Status"];
  
  if (businessType.includes('coffee') || businessType.includes('cafe')) {
    return [...commonFeatures, "Specialties", "Atmosphere", "Operating Hours"];
  } else if (businessType.includes('restaurant')) {
    return [...commonFeatures, "Cuisine", "Dining Experience", "Operating Hours"];
  } else {
    return [...commonFeatures, "Operating Hours", "Services"];
  }
}