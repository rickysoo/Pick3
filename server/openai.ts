import OpenAI from "openai";
import type { InsertSearchRequest, ComparisonResult, ComparisonResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function compareProducts(searchData: InsertSearchRequest): Promise<ComparisonResponse> {
  try {
    const prompt = `You are a product comparison expert. Based on the following search query, find and compare 3 relevant products or services. 

CRITICAL: Only provide factual, verifiable information. If you don't have accurate data for any field, use "No data available" or leave it blank. Do not make up or estimate any information.

Search Query: ${searchData.searchQuery}

Please respond with a JSON object containing:
1. "products": Array of 3 products, each with:
   - "name": Exact product name
   - "description": Brief factual description (max 100 chars) or "No data available"
   - "pricing": Exact pricing information from official sources or "Contact for pricing" if unknown
   - "rating": Only use verified ratings from official sources (number) or null if unknown
   - "website": Official website URL only - must be accurate
   - "logoUrl": Direct URL to official logo image or null if not available
   - "features": Object with 7-10 key features - only include verified features as boolean or exact text
   - "badge": Optional badge text based on factual comparison (e.g., "Most Popular", "Lowest Price")
   - "badgeColor": Badge color (green, blue, orange, purple)

2. "features": Array of feature names that are actually compared across products

IMPORTANT RULES:
- Never estimate or guess information
- Use official sources only
- If uncertain about any detail, mark as "No data available" or null
- Pricing must be exact from official sources
- Ratings must be from verified review platforms
- Website URLs must be accurate and official
- Only compare features that can be verified`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert product comparison analyst with access to current market data. Search for and provide only factual, verifiable information from official sources. Never estimate, approximate, or generate fictional data. If specific information is not available from reliable sources, explicitly state 'No data available' or use null values."
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
    
    // Validate and ensure we have the expected structure
    if (!result.products || !Array.isArray(result.products) || result.products.length !== 3) {
      throw new Error("Invalid response format from OpenAI");
    }

    // Ensure all products have required fields with accurate data handling
    result.products = result.products.map((product: any, index: number) => ({
      name: product.name || `Product ${index + 1}`,
      description: product.description || "No data available",
      pricing: product.pricing || "Contact for pricing",
      rating: product.rating !== null && product.rating !== undefined ? Math.min(5, Math.max(1, product.rating)) : null,
      website: product.website || "#",
      logoUrl: product.logoUrl || null,
      features: product.features || {},
      badge: product.badge,
      badgeColor: product.badgeColor || "blue"
    }));

    return {
      products: result.products,
      features: result.features || Object.keys(result.products[0]?.features || {})
    };

  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error(`Failed to generate product comparison: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
