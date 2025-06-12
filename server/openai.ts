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

    const prompt = `You are a product and service comparison expert. Today's date is ${currentDate}. 

STRICT DATA INTEGRITY RULES:
- Only compare products, software, and services where you can provide verified, authentic information
- For local business searches (coffee shops, restaurants in specific locations): Return empty results with explanation
- Never create fictional business names, addresses, or operational details
- Only provide comparisons when you can guarantee factual accuracy

SUPPORTED CATEGORIES:
1. PRODUCTS: Electronics, appliances with verified brands (Samsung, Apple, etc.)
2. SOFTWARE: Established platforms (GitHub, VS Code, Figma, etc.)  
3. SERVICES: Verified online services and platforms

For unsupported categories, return empty products array with clear explanation of limitations.

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

FACTUAL ACCURACY REQUIREMENTS:
- For products: Use verified brands and current models (Samsung Galaxy S24, iPhone 15, etc.)
- For local businesses: Use known establishments or well-researched representative examples with transparency about data sources
- For services: Include established platforms with verified information
- All pricing should reflect realistic market rates
- Always set rating to null (we don't aggregate reviews)
- Website URLs must be authentic for known businesses
- Compare 8-15 relevant features based on category
- Each option needs appropriate badges based on factual attributes
- Be transparent when providing representative examples vs verified current data
- Feature names must reflect actual characteristics
- Include disclaimers when appropriate about information currency`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a product and service comparison expert with strict data integrity protocols.

SUPPORTED CATEGORIES:
1. PRODUCTS: Electronics, appliances with verified brands (Samsung Galaxy S24, iPhone 15, etc.)
2. SOFTWARE: Established platforms (GitHub, VS Code, Replit, Figma, etc.)  
3. SERVICES: Verified online services and platforms

UNSUPPORTED CATEGORIES:
- Local businesses (coffee shops, restaurants in specific locations)
- Location-specific services requiring current local knowledge

For unsupported categories, return empty products array with explanation that you cannot verify current local business information and direct users to Google Maps or local directories for accurate, up-to-date information.`
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
