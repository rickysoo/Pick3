import OpenAI from "openai";
import type { InsertSearchRequest, ComparisonResult, ComparisonResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

export async function compareProducts(searchData: InsertSearchRequest): Promise<ComparisonResponse> {
  try {
    // Get current date for context
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const prompt = `You are a comprehensive comparison expert with search capabilities. Today's date is ${currentDate}. 

SEARCH-ENABLED COMPARISON CATEGORIES:
1. PRODUCTS: Electronics, appliances, gadgets - use current market data
2. SOFTWARE: Platforms, development tools, SaaS services with verified information  
3. LOCAL BUSINESSES: Coffee shops, restaurants, hotels in specific locations - search for real establishments
4. SERVICES: Online services, subscriptions, courses with current information

For local business searches, use your search capabilities to find authentic businesses that are currently operating. Provide real names, addresses, verified hours, and contact details only.

Search Query: ${searchData.searchQuery}

Please respond with a JSON object containing:
1. "products": Array of 1-3 products (only include products you can verify exist), each with:
   - "name": Exact product name
   - "description": Brief factual description (max 100 chars) or "No data available"
   - "pricing": Short, concise pricing (e.g., "From $10/month", "Free", "$99", "Contact sales") - keep under 15 characters
   - "rating": NEVER provide ratings - always set to null since you cannot verify authentic rating sources
   - "website": Official website URL only - must be accurate
   - "logoUrl": null (do not include logo URLs)
   - "features": Object with relevant features based on category - for products: specs like display, processor, memory; for local businesses: atmosphere, price range, specialties, accessibility, hours, parking; for services: features, pricing tiers, support, integrations
   - "badge": REQUIRED badge text for each product based on factual comparison (e.g., "Most Popular", "Most Affordable", "Best Value", "Premium Choice", "Editor's Pick") - ensure each product gets a unique descriptive badge
   - "badgeColor": Badge color (green, blue, orange, purple)

2. "features": Array of 5-20 feature names that are compared across products (include key specs like display, processor, memory, storage, camera, battery, connectivity, build quality, special features, etc. for comprehensive comparison)
3. "message": If no products found or fewer than expected, include an explanatory message

SEARCH-ENABLED VERIFICATION RULES:
- For products: Use current market data for real brands and models (Samsung Galaxy S24, iPhone 15, etc.)
- For local businesses: Use search to find real establishments with verified names, addresses, and operating status
- For services: Include verified platforms with current information
- All pricing must reflect current market rates from search results
- Always set rating to null (we don't provide review aggregation)
- Website URLs must be authentic and verified through search
- Compare 8-15 relevant features based on searched information
- Each option needs factual badges based on verified attributes
- Use search capabilities to verify business existence and details
- Feature names must reflect actual characteristics found through search
- Provide real addresses, phone numbers, and hours when available from search results`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a comprehensive comparison expert with search capabilities. You can compare:

1. PRODUCTS: Electronics, appliances, gadgets with current market data
2. SOFTWARE: Platforms, development tools, SaaS services  
3. LOCAL BUSINESSES: Use search to find real coffee shops, restaurants, hotels in specific locations
4. SERVICES: Online services, subscriptions, courses with verified information

SEARCH-ENABLED REQUIREMENTS:
- Use search capabilities to find authentic local businesses with current information
- For local searches, provide real business names, addresses, and verified details
- Include accurate pricing, hours, and contact information from search results
- Only return businesses that actually exist and are currently operating
- Cross-reference multiple sources to ensure accuracy
- If search yields no reliable results, explain why with specific reasoning

Always prioritize factual accuracy over completing the full 3-item comparison.`
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
    
    // Validate basic structure - handle both empty results and malformed responses
    if (!result || typeof result !== 'object') {
      throw new Error("Invalid response format from OpenAI");
    }
    
    // Initialize products array if missing
    if (!result.products) {
      result.products = [];
    }
    
    if (!Array.isArray(result.products)) {
      throw new Error("Invalid response format from OpenAI");
    }

    // With search-enabled model, we can now handle local business searches with real data

    // Handle case where no products found
    if (result.products.length === 0) {
      return {
        products: [],
        features: [],
        message: result.message || "No products found matching your search criteria. Please try a different search term."
      };
    }

    // Pass through only what OpenAI provides - no synthetic fallbacks
    result.products = result.products.map((product: any) => ({
      name: product.name,
      description: product.description,
      pricing: product.pricing,
      rating: null, // Never show ratings as AI cannot verify authentic sources
      website: product.website,
      logoUrl: product.logoUrl,
      features: product.features,
      badge: product.badge,
      badgeColor: product.badgeColor
    }));

    return {
      products: result.products,
      features: result.features || [],
      message: result.message
    };

  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error(`Failed to generate product comparison: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function generatePlaceholderExamples(): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Generate exactly 3 diverse, catchy product search examples. Make them specific and fun with details like budget or cool features. Cover different categories. Keep under 70 characters each. Make them sound exciting and modern. Respond with JSON format: {\"examples\": [\"example1\", \"example2\", \"example3\"]}"
        },
        {
          role: "user",
          content: "Generate 3 diverse product comparison search examples with specific details and requirements."
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    if (result.examples && Array.isArray(result.examples) && result.examples.length === 3) {
      return result.examples;
    }

    throw new Error("Invalid response format from OpenAI for placeholder examples");

  } catch (error) {
    console.error("Error generating placeholder examples:", error);
    throw error;
  }
}
