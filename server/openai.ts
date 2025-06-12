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

    const prompt = `You are a comprehensive comparison expert. Today's date is ${currentDate}. Compare ANY of these categories based on the search query:

VALID CATEGORIES TO COMPARE:
1. PRODUCTS: Electronics, appliances, gadgets, physical items
2. SOFTWARE: Apps, platforms, development tools, SaaS services  
3. LOCAL BUSINESSES: Coffee shops, restaurants, hotels, salons, gyms, stores in specific cities/neighborhoods
4. SERVICES: Online services, subscriptions, courses, professional services
5. EXPERIENCES: Travel destinations, activities, entertainment venues

For LOCAL BUSINESS searches like "coffee shops in [location]": Provide 3 realistic business examples with names, specialties, atmosphere, pricing ranges, and location details. These are valid comparisons that help users choose where to go.

ALWAYS provide 3 options unless the search is genuinely impossible (like "time travel cafes").

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

IMPORTANT RULES:
- For products: provide real brands and models (Samsung, Apple, Xiaomi, etc.)
- For local businesses: provide specific business names or realistic examples from the area
- For services: include actual service providers, apps, or platforms
- Include realistic pricing and relevant details
- Always set rating to null
- Use appropriate website URLs (official sites for products, business websites for local places)
- Compare 8-15 relevant features based on the category
- Each option needs a unique badge (Most Popular, Best Value, Local Favorite, etc.)
- Only return "no results" for impossible searches like "unicorn cafes" or "time travel services"
- Feature names should be readable and relevant to the category
- For local searches, consider location-specific factors (accessibility, atmosphere, specialties)`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a comprehensive comparison expert helping users make informed decisions about products, services, AND local businesses. You can compare:

1. PRODUCTS: Electronics, appliances, gadgets from brands like Samsung, Apple
2. SOFTWARE: Apps, platforms, tools like Replit, VS Code, Notion  
3. LOCAL BUSINESSES: Coffee shops, restaurants, hotels, services in specific cities/areas
4. SERVICES: Subscriptions, courses, memberships, professional services
5. EXPERIENCES: Travel destinations, activities, events

For local business searches (like "coffee shops in [city]"), provide 3 real or realistic business examples from that area with relevant features like atmosphere, pricing, specialties, location, hours. Always return valid comparisons unless the search is genuinely impossible. Set rating to null.`
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
