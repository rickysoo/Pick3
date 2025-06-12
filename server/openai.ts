import OpenAI from "openai";
import type { InsertSearchRequest, ComparisonResult, ComparisonResponse } from "@shared/schema";
import { searchLocalBusinesses, getLocalBusinessFeatures } from "./google-places";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

async function compareWithSearchModel(searchData: InsertSearchRequest, currentDate: string): Promise<ComparisonResponse> {
  const prompt = `You are a product and service comparison expert. Today's date is ${currentDate}. 

STRICT DATA INTEGRITY RULES:
- Only compare products, software, and services where you can provide verified, authentic information
- Never create fictional business names, addresses, or operational details
- Only provide comparisons when you can guarantee factual accuracy

SUPPORTED CATEGORIES:
1. PRODUCTS: Electronics, appliances with verified brands (Samsung, Apple, etc.)
2. SOFTWARE: Established platforms (GitHub, VS Code, Figma, etc.)  
3. SERVICES: Verified online services and platforms

Search Query: ${searchData.searchQuery}

Please respond with a JSON object containing:
1. "products": Array of 1-3 products (only include products you can verify exist), each with:
   - "name": Exact product name
   - "description": Brief factual description (max 100 chars)
   - "pricing": Short, concise pricing (e.g., "From $10/month", "Free", "$99") - keep under 15 characters
   - "rating": Always set to null
   - "website": Official website URL only
   - "logoUrl": null
   - "features": Object with relevant features based on category
   - "badge": Descriptive badge text (e.g., "Most Popular", "Best Value", "Premium Choice")
   - "badgeColor": Badge color (green, blue, orange, purple)

2. "features": Array of feature names that are compared across products
3. "message": Explanatory message if needed`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a product comparison expert. Only provide verified, authentic information about products and services. For unsupported categories, return empty products array with clear explanation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result || typeof result !== 'object') {
      throw new Error("Invalid response format from OpenAI");
    }
    
    if (!result.products || !Array.isArray(result.products)) {
      result.products = [];
    }
    
    if (!result.features || !Array.isArray(result.features)) {
      result.features = [];
    }

    return {
      products: result.products || [],
      features: result.features || [],
      message: result.message || ""
    };
  } catch (error) {
    console.error('Error in compareWithSearchModel:', error);
    return {
      products: [],
      features: [],
      message: "An error occurred while processing your search. Please try again."
    };
  }
}

export async function compareProducts(searchData: InsertSearchRequest): Promise<ComparisonResponse> {
  try {
    console.log(`🔍 Starting compareProducts with query: "${searchData.searchQuery}"`);
    
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Use LLM to determine search intent and approach
    const intentAnalysisResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Analyze the search intent and recommend the best approach. Respond with JSON: {\"approach\": \"local_first\", \"has_product\": true, \"has_location\": true} where approach can be 'local_only' (pure local business search), 'product_only' (product comparison), or 'local_first' (try local search, fallback to product if no results). Set has_product to true if query mentions a specific product category, has_location to true if mentions a specific place."
        },
        {
          role: "user",
          content: `Analyze this query: "${searchData.searchQuery}"`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 100,
      temperature: 0
    });

    const intentAnalysis = JSON.parse(intentAnalysisResponse.choices[0].message.content || '{}');
    const approach = intentAnalysis.approach || 'product_only';
    const hasProduct = intentAnalysis.has_product || false;
    const hasLocation = intentAnalysis.has_location || false;
    
    console.log(`🔍 Query: "${searchData.searchQuery}", approach: ${approach}, hasProduct: ${hasProduct}, hasLocation: ${hasLocation}`);
    
    // Try local search first for local_first and local_only approaches
    if (approach === 'local_only' || approach === 'local_first') {
      console.log(`🏪 Processing local business search...`);
      try {
        // Use LLM to extract business type and location
        const extractionResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "Extract the business type and location from a local business search query. For business type, infer from context: 'hungry' = restaurant, 'coffee' = cafe, 'shopping' = store, etc. Use categories like 'restaurant', 'cafe', 'store', 'hotel'. For location, extract the city, area, or neighborhood. Respond with JSON format: {\"businessType\": \"type\", \"location\": \"location\"}. If either cannot be determined, use null."
            },
            {
              role: "user",
              content: `Extract business type and location from this query: "${searchData.searchQuery}"`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 50,
          temperature: 0
        });

        const extraction = JSON.parse(extractionResponse.choices[0].message.content || '{}');
        const businessType = extraction.businessType;
        const location = extraction.location;
        
        if (businessType && location) {
          console.log(`Searching for ${businessType} in ${location} using Google Places API`);
          const businesses = await searchLocalBusinesses(businessType, location);
          
          if (businesses.length > 0) {
            const features = getLocalBusinessFeatures(businessType);
            return {
              products: businesses,
              features,
              message: `Found ${businesses.length} verified ${businessType} location${businesses.length > 1 ? 's' : ''} in ${location} using real-time data from Google Places.`
            };
          }
        }
        
        // If local search failed but query has product intent, fallback to product comparison
        if (approach === 'local_first' && hasProduct) {
          console.log(`🔄 Local search yielded no results, falling back to product comparison...`);
          return await compareWithSearchModel(searchData, currentDate);
        }
        
        return {
          products: [],
          features: [],
          message: "No verified local businesses found for this search. Please check the location name or try a different search term."
        };
      } catch (error) {
        console.log('Google Places API error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // If local search failed but query has product intent, fallback to product comparison
        if (approach === 'local_first' && hasProduct) {
          console.log(`🔄 Local search failed, falling back to product comparison...`);
          return await compareWithSearchModel(searchData, currentDate);
        }
        
        if (errorMessage.includes('access denied') || errorMessage.includes('REQUEST_DENIED')) {
          return {
            products: [],
            features: [],
            message: "Google Places API requires additional setup. Please ensure the API key has Places API enabled and billing configured in Google Cloud Console. For now, please use Google Maps directly for local business information."
          };
        }
        return {
          products: [],
          features: [],
          message: "Unable to search local businesses at this time. Please try again later or check Google Maps directly for local business information."
        };
      }
    }
    
    // Handle product-only searches
    if (approach === 'product_only') {
      return await compareWithSearchModel(searchData, currentDate);
    }

    // If no specific approach matched, provide helpful guidance
    return {
      products: [],
      features: [],
      message: "I couldn't determine how to best help with this search. Please try being more specific about what you're looking for."
    };
  } catch (error) {
    console.error('Error in compareProducts:', error);
    return {
      products: [],
      features: [],
      message: "An error occurred while processing your search. Please try again."
    };
  }
}

export async function generatePlaceholderExamples(): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Generate 3 diverse search examples for a product comparison app. Include mix of products (electronics, software, services) and some local business searches. Keep examples short, realistic, and varied. Respond with JSON array of strings."
        },
        {
          role: "user",
          content: "Generate 3 example search queries"
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 200
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.examples || [
      "Wireless headphones under $100",
      "Project management tools for teams",
      "Coffee shops in downtown"
    ];
  } catch (error) {
    console.error('Error generating examples:', error);
    return [
      "Best smartphones under $500",
      "Video editing software comparison", 
      "Restaurants near KLCC"
    ];
  }
}