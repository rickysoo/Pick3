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

CRITICAL: Only provide factual, verifiable information from current sources. Ensure all product names, services, and companies are up-to-date (e.g., use "Google Gemini" not "Google Bard", current company names, etc.). If you cannot find sufficient authentic current data, provide fewer results or indicate no results found. NEVER make up or estimate any information.

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
- If you cannot find any relevant products, return empty products array with message explaining no results found
- If you can only find 1-2 products, return only those products with message explaining limited results
- Never estimate or guess information
- Use official sources only
- If uncertain about any detail, mark as "No data available" or null
- Pricing must be concise and from official sources (under 15 characters)
- NEVER include ratings - always set rating to null as AI cannot verify authentic rating sources
- Website URLs must be accurate and official
- Only compare features that can be verified
- Do not include logoUrl in responses
- Feature names must be readable (e.g., "Free Trial" not "freeTrial", "Mobile Support" not "mobileSupport")
- CRITICAL: Every product must have a unique descriptive badge (e.g., "Most Popular", "Most Affordable", "Best Value")`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert product comparison analyst with access to current information. Today's date is ${currentDate}. Provide only factual, verifiable information from current official sources. CRITICAL: Use up-to-date product names and company information (e.g., 'Google Gemini' not 'Google Bard', current pricing, active services). If you cannot find sufficient authentic current data for a search query, return fewer results or no results with an explanatory message. Never generate fictional products or companies. Never generate user ratings - always set rating to null since AI cannot access authentic review platforms. IMPORTANT: Every product must have a unique descriptive badge (e.g., 'Most Popular', 'Most Affordable', 'Best Value', 'Premium Choice'). Never estimate, approximate, or generate fictional data. If specific information is not available from reliable current sources, explicitly state 'No data available' or use null values.`
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
