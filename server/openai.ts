import OpenAI from "openai";
import type { InsertSearchRequest, ComparisonResult, ComparisonResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function compareProducts(searchData: InsertSearchRequest): Promise<ComparisonResponse> {
  try {
    const prompt = `You are a product comparison expert. Based on the following search criteria, find and compare 3 relevant products or services. Provide detailed, accurate information.

Search Criteria:
- Product/Service: ${searchData.productName}
- Category: ${searchData.category || "General"}
- Region: ${searchData.region || "Global"}
- Language: ${searchData.language || "English"}
- Use Case: ${searchData.useCase || "General use"}
- Limitations/Requirements: ${searchData.limitations || "None specified"}

Please respond with a JSON object containing:
1. "products": Array of 3 products, each with:
   - "name": Product name
   - "description": Brief description (max 100 chars)
   - "pricing": Pricing information
   - "rating": Rating out of 5 (number)
   - "website": Official website URL
   - "features": Object with 7-10 key features as boolean values or short strings
   - "badge": Optional badge text (e.g., "Best Match", "Popular Choice", "Budget Friendly")
   - "badgeColor": Badge color (green, blue, orange, purple)

2. "features": Array of feature names that are compared across all products

Ensure all information is accurate and current. Focus on the most important features for the specified use case.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert product comparison analyst. Provide accurate, detailed product comparisons in the requested JSON format."
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

    // Ensure all products have required fields
    result.products = result.products.map((product: any, index: number) => ({
      name: product.name || `Product ${index + 1}`,
      description: product.description || "No description available",
      pricing: product.pricing || "Contact for pricing",
      rating: Math.min(5, Math.max(1, product.rating || 4)),
      website: product.website || "#",
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
