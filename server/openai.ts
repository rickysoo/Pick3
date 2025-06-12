import OpenAI from "openai";
import type { InsertSearchRequest, ComparisonResult, ComparisonResponse } from "@shared/schema";
import { searchLocalBusinesses, getLocalBusinessFeatures } from "./google-places";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

async function extractProductFromLocalQuery(query: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Extract the product/service type from a location-based query and convert it to a general product search. For example: 'portrait photos in Balakong' -> 'portrait photography equipment', 'buying laptop in Ampang' -> 'laptops', 'coffee shops in KL' -> 'coffee making equipment'. Return only the product-focused search term."
        },
        {
          role: "user",
          content: `Convert this location-based query to a product search: "${query}"`
        }
      ],
      max_tokens: 50,
      temperature: 0
    });

    return response.choices[0].message.content?.trim() || query;
  } catch (error) {
    console.error('Error extracting product from query:', error);
    return query;
  }
}

async function compareWithSearchModel(searchData: InsertSearchRequest, currentDate: string): Promise<ComparisonResponse> {
  const prompt = `You are a product and service comparison expert. Today's date is ${currentDate}. 

STRICT DATA INTEGRITY RULES:
- Only provide verified, authentic information from real sources
- Never create fictional business names, addresses, or operational details
- All comparisons must be based on factual, verifiable data

UNIVERSAL SEARCH CAPABILITY:
- Support ALL types of searches: brands, products, services, places
- No industry restrictions - handle any legitimate business category
- Interpret user intent broadly while maintaining authenticity
- Provide comparisons for any verifiable entities across all industries

APPROACH:
- For ANY product/service/brand: Find authentic, established options
- For ANY location-based query: Use real business data
- Always prioritize factual accuracy over category limitations

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

    // If no products found, try a more flexible interpretation
    if (result.products.length === 0) {
      console.log('🔄 No products found, attempting flexible interpretation...');
      
      const flexiblePrompt = `The user searched for: "${searchData.searchQuery}"

Since no direct products were found, provide helpful alternatives by interpreting the query more broadly:

- Photography/creative queries → Camera equipment, editing software, design tools
- Business/service queries → Software platforms, SaaS solutions  
- Development/coding queries → IDEs, frameworks, development platforms
- General concepts → Related verified products or software

Provide 1-3 authentic, verifiable products that could genuinely help with the user's underlying need.

JSON format with: products (name, description, pricing, rating: null, website, logoUrl: null, features, badge, badgeColor), features, message.`;

      try {
        const flexibleResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "Provide authentic product suggestions that genuinely relate to user needs." },
            { role: "user", content: flexiblePrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.4
        });

        const flexibleResult = JSON.parse(flexibleResponse.choices[0].message.content || "{}");
        
        if (flexibleResult.products && flexibleResult.products.length > 0) {
          const formattedFlexibleFeatures = await formatFeatureNames(flexibleResult.features || []);
          return {
            products: flexibleResult.products,
            features: formattedFlexibleFeatures,
            message: flexibleResult.message || "Here are related products that might help with your needs."
          };
        }
      } catch (flexibleError) {
        console.error('Flexible interpretation error:', flexibleError);
      }
    }

    // Format feature names to proper English
    const formattedFeatures = await formatFeatureNames(result.features || []);
    
    return {
      products: result.products || [],
      features: formattedFeatures,
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

async function formatFeatureNames(features: string[]): Promise<string[]> {
  if (!features || features.length === 0) return features;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Convert technical feature names to proper English labels. Examples: 'userFriendlyInterface' -> 'User-Friendly Interface', 'communityProjects' -> 'Community Projects', 'customBlocks' -> 'Custom Blocks', 'livePreview' -> 'Live Preview', 'projectSharing' -> 'Project Sharing', 'mobileResponsive' -> 'Mobile Responsive', 'blockCustomization' -> 'Block Customization', 'multiLanguageSupport' -> 'Multi-Language Support', 'integrationAbility' -> 'Integration Ability', 'smartCodeCompletion' -> 'Smart Code Completion', 'intelligentCodeEditor' -> 'Intelligent Code Editor', 'extensions' -> 'Extensions', 'debugger' -> 'Debugger', 'platforms' -> 'Supported Platforms', 'frameworks' -> 'Framework Support', 'refactoring' -> 'Code Refactoring'. Return a JSON object with 'features' array containing formatted feature names in the same order."
        },
        {
          role: "user",
          content: `Format these feature names: ${JSON.stringify(features)}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.features || features;
  } catch (error) {
    console.error('Error formatting feature names:', error);
    // Fallback: simple camelCase to Title Case conversion
    return features.map(feature => 
      feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
    );
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
              content: "Extract business type and location from any search query without industry restrictions. Preserve all specific requirements, categories, or modifiers. Examples: 'law firms in KL' -> {\"businessType\": \"law firm\", \"location\": \"KL\"}, 'yoga studios downtown' -> {\"businessType\": \"yoga studio\", \"location\": \"downtown\"}, 'car dealerships in PJ' -> {\"businessType\": \"car dealership\", \"location\": \"PJ\"}, 'plumbers near me' -> {\"businessType\": \"plumber\", \"location\": \"near me\"}. Handle ANY business category universally. Respond with JSON format: {\"businessType\": \"type\", \"location\": \"location\"}."
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
        
        console.log(`🔍 Extracted businessType: "${businessType}", location: "${location}"`);
        
        if (businessType && location) {
          console.log(`Searching for ${businessType} in ${location} using Google Places API`);
          const businesses = await searchLocalBusinesses(businessType, location);
          
          if (businesses.length > 0) {
            const features = getLocalBusinessFeatures(businessType);
            const formattedLocalFeatures = await formatFeatureNames(features);
            return {
              products: businesses,
              features: formattedLocalFeatures,
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
          content: "Generate 3 diverse search examples for a universal comparison app that handles products, services, local businesses, and brands. Mix categories: electronics, software, professional services, restaurants, retail stores, healthcare, automotive, etc. Include location-based searches. Keep examples realistic and inspiring. Respond with JSON object containing 'examples' array."
        },
        {
          role: "user",
          content: "Generate 3 varied search examples showing the app's universal capabilities"
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 200
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.examples || [
      "Law firms in Kuala Lumpur",
      "Gaming laptops under $1200",
      "Vegetarian restaurants in Bangsar"
    ];
  } catch (error) {
    console.error('Error generating examples:', error);
    return [
      "Car insurance companies",
      "Yoga studios in Petaling Jaya", 
      "Project management software"
    ];
  }
}