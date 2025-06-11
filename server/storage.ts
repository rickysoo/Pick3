import { searchRequests, type SearchRequest, type InsertSearchRequest, type ComparisonResult } from "@shared/schema";

export interface IStorage {
  createSearchRequest(request: InsertSearchRequest): Promise<SearchRequest>;
  updateSearchRequestResults(id: number, results: ComparisonResult[]): Promise<SearchRequest | undefined>;
  getSearchRequest(id: number): Promise<SearchRequest | undefined>;
}

export class MemStorage implements IStorage {
  private searchRequests: Map<number, SearchRequest>;
  private currentId: number;

  constructor() {
    this.searchRequests = new Map();
    this.currentId = 1;
  }

  async createSearchRequest(insertRequest: InsertSearchRequest): Promise<SearchRequest> {
    const id = this.currentId++;
    const request: SearchRequest = {
      ...insertRequest,
      id,
      results: null,
      createdAt: new Date().toISOString(),
    };
    this.searchRequests.set(id, request);
    return request;
  }

  async updateSearchRequestResults(id: number, results: ComparisonResult[]): Promise<SearchRequest | undefined> {
    const request = this.searchRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = { ...request, results };
    this.searchRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async getSearchRequest(id: number): Promise<SearchRequest | undefined> {
    return this.searchRequests.get(id);
  }
}

export const storage = new MemStorage();
