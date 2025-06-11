import OpenAI from "openai";
import type { InsertSearchRequest, ComparisonResult, ComparisonResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function compareProducts(searchData: InsertSearchRequest): Promise<ComparisonResponse> {
  try {
    // Get current date for context
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const prompt = `You are a product comparison expert. Today's date is ${currentDate}. Based on the following search query, find and compare relevant products or services using the most current information available as of this date.

IMPORTANT: Provide factual information about real products and services that exist. Use current product names and companies (e.g., "Google Gemini" not "Google Bard"). For popular product categories with many options, select 3 representative examples from different companies/brands. Only return "no results" if the search query is for something that genuinely doesn't exist or is extremely niche with no viable options.

Search Query: ${searchData.searchQuery}

Please respond with a JSON object containing:
1. "products": Array of 1-3 products (only include products you can verify exist), each with:
   - "name": Exact product name
   - "description": Brief factual description (max 100 chars) or "No data available"
   - "pricing": Short, concise pricing (e.g., "From $10/month", "Free", "$99", "Contact sales") - keep under 15 characters
   - "rating": NEVER provide ratings - always set to null since you cannot verify authentic rating sources
   - "website": Official website URL only - must be accurate
   - "logoUrl": null (do not include logo URLs)
   - "features": Object with 7-10 key features - use clear, readable names (e.g., "Baggage Included" not "baggageIncluded") - only include verified features as boolean or exact text
   - "badge": REQUIRED badge text for each product based on factual comparison (e.g., "Most Popular", "Most Affordable", "Best Value", "Premium Choice", "Editor's Pick") - ensure each product gets a unique descriptive badge
   - "badgeColor": Badge color (green, blue, orange, purple)

2. "features": Array of feature names that are actually compared across products
3. "message": If no products found or fewer than expected, include an explanatory message

IMPORTANT RULES:
- For common product categories (smartphones, laptops, headphones, etc.), provide 3 real products from different brands
- Use well-known companies and their actual products (Samsung, Apple, Xiaomi, etc.)
- Include realistic pricing ranges based on the search criteria
- Always set rating to null
- Use official website URLs from major manufacturers
- Compare standard features relevant to the product category
- Each product needs a unique badge (Most Popular, Best Value, Premium Choice, etc.)
- Only return "no results" for truly impossible or non-existent product categories
- Feature names should be readable (e.g., "Fast Charging" not "fastCharging")
- Keep pricing under 15 characters and use currency specified in search`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert product comparison analyst. Today's date is ${currentDate}. Provide factual information about real products and services from reputable companies. Use current product names (e.g., 'Google Gemini' not 'Google Bard'). For popular product categories, find 3 representative options from different brands/companies. Only return no results for genuinely non-existent or extremely niche categories. Never generate fictional companies. Set rating to null always. Each product needs a unique badge (Most Popular, Most Affordable, Best Value, Premium Choice, etc.). Use real pricing from official sources when available, otherwise use "Contact for pricing" or "See website".`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate basic structure
    if (!result.products || !Array.isArray(result.products)) {
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
