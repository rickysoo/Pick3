import ProductCard from "./product-card";
import ComparisonTable from "./comparison-table";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type { ComparisonResponse } from "@shared/schema";

interface ComparisonResultsProps {
  data: ComparisonResponse;
  onNewSearch: () => void;
}

export default function ComparisonResults({ data, onNewSearch }: ComparisonResultsProps) {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Here are your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">top matches</span>
          </h2>
          <p className="text-xl text-gray-600">AI-powered comparison based on your specific requirements</p>
        </div>

        {/* Product Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12 items-stretch">
          {data.products.map((product, index) => (
            <ProductCard key={index} product={product} index={index} />
          ))}
        </div>

        {/* Detailed Comparison Table */}
        <ComparisonTable products={data.products} features={data.features} />

        {/* Call to Action */}
        <div className="text-center mt-6">
          <div className="gradient-primary rounded-2xl p-8 text-white animate-fade-in">
            <h3 className="text-2xl font-bold mb-4">Need a different comparison?</h3>
            <p className="text-lg mb-6 opacity-90">Try another search with different criteria or explore more categories</p>
            <Button
              onClick={onNewSearch}
              className="bg-white text-blue-600 font-bold py-4 px-12 rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-110 shadow-2xl hover:shadow-3xl text-lg border-2 border-white"
            >
              <RotateCcw className="mr-3 h-5 w-5" />
              Search Again
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
