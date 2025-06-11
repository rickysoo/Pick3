import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSearchRequestSchema } from "@shared/schema";
import { compareProducts, generatePlaceholderExamples } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new comparison search
  app.post("/api/compare", async (req, res) => {
    try {
      const validatedData = insertSearchRequestSchema.parse(req.body);
      
      // Create the search request
      const searchRequest = await storage.createSearchRequest(validatedData);
      
      // Get AI-powered comparison
      const comparisonResults = await compareProducts(validatedData);
      
      // Update the search request with results
      const updatedRequest = await storage.updateSearchRequestResults(
        searchRequest.id, 
        comparisonResults.products
      );
      
      res.json({
        id: searchRequest.id,
        ...comparisonResults
      });
    } catch (error) {
      console.error("Error in /api/compare:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to process comparison request"
      });
    }
  });

  // Get comparison results by ID
  app.get("/api/compare/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const searchRequest = await storage.getSearchRequest(id);
      
      if (!searchRequest) {
        return res.status(404).json({ message: "Comparison not found" });
      }
      
      res.json(searchRequest);
    } catch (error) {
      console.error("Error in /api/compare/:id:", error);
      res.status(500).json({ message: "Failed to retrieve comparison" });
    }
  });

  // Generate dynamic placeholder examples
  app.get("/api/placeholder-examples", async (req, res) => {
    try {
      const examples = await generatePlaceholderExamples();
      res.json({ examples });
    } catch (error) {
      console.error("Error generating placeholder examples:", error);
      // Return fallback examples if OpenAI fails
      res.json({ 
        examples: [
          "Project management software for small teams, budget under $50/month",
          "Video conferencing tools with screen sharing and mobile support",
          "Cloud storage services with 1TB+ capacity and file sharing features"
        ]
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
