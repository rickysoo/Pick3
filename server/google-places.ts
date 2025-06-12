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
    // Universal search query construction - no industry restrictions
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
  const features: Record<string, boolean | string> = {
    "Address": place.formatted_address || "Address not available",
    "Price Range": pricingMap[priceLevel as keyof typeof pricingMap] || "$$",
    "Currently Open": place.opening_hours?.open_now ? "Yes" : "No",
    "Phone Number": place.formatted_phone_number || "Not available",
    "Business Status": place.business_status === 'OPERATIONAL' ? "Open" : "Status unknown"
  };

  // Universal feature detection - no industry restrictions
  if (place.types.includes('cafe') || place.name.toLowerCase().includes('coffee') || place.name.toLowerCase().includes('cafe')) {
    features["Specialties"] = "Coffee & beverages";
    features["Atmosphere"] = "Cafe environment";
  } else if (isRestaurant || place.types.includes('restaurant') || place.types.includes('food')) {
    features["Cuisine"] = "Various dishes";
    features["Dining Experience"] = "Restaurant experience";
  } else if (place.types.includes('store') || place.types.includes('shopping')) {
    features["Services"] = "Retail services";
    features["Specialties"] = "Various products";
  } else {
    // Universal fallback for any business type
    features["Services"] = "Professional services";
    features["Specialties"] = "Business services";
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
  // Universal features for all business types - no industry restrictions
  const baseFeatures = ["Address", "Price Range", "Currently Open", "Phone Number", "Business Status", "Operating Hours"];
  
  // Add contextual features based on business type universally
  const type = businessType.toLowerCase();
  if (type.includes('coffee') || type.includes('cafe')) {
    return [...baseFeatures, "Specialties", "Atmosphere"];
  } else if (type.includes('restaurant') || type.includes('food')) {
    return [...baseFeatures, "Cuisine", "Dining Experience"];
  } else if (type.includes('hotel') || type.includes('accommodation')) {
    return [...baseFeatures, "Amenities", "Room Types"];
  } else if (type.includes('store') || type.includes('shop') || type.includes('retail')) {
    return [...baseFeatures, "Services", "Specialties"];
  } else {
    // Universal fallback for any business category
    return [...baseFeatures, "Services", "Specialties"];
  }
}