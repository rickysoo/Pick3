import ProductCard from "./product-card";
import ComparisonTable from "./comparison-table";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type { ComparisonResponse } from "@shared/schema";
import { trackEvent } from "@/lib/analytics";

interface ComparisonResultsProps {
  data: ComparisonResponse;
  onNewSearch: () => void;
}

export default function ComparisonResults({ data, onNewSearch }: ComparisonResultsProps) {
  // Handle no results case
  if (data.products.length === 0) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl shadow-lg p-12 mb-8">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">No Results Found</h2>
            <p className="text-lg text-gray-600 mb-8">
              {data.message || "We couldn't find any products matching your search criteria. Try adjusting your search terms or being more specific."}
            </p>
            <button
              onClick={() => {
                trackEvent('no_results_new_search', 'navigation', 'no_results_button');
                onNewSearch();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Try New Search
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {data.products.length === 1 ? 'top pick' : 
               data.products.length === 2 ? 'top 2 picks' : 
               'top 3 picks'}
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            {data.message || "Handpicked by AI, tailored for you"}
          </p>
        </div>

        {/* Product Cards */}
        <div className={`grid gap-8 mb-12 items-stretch ${
          data.products.length === 1 ? 'max-w-md mx-auto' :
          data.products.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
          'md:grid-cols-3'
        }`}>
          {data.products.map((product, index) => (
            <ProductCard key={index} product={product} index={index} />
          ))}
        </div>

        {/* Detailed Comparison Table */}
        <ComparisonTable products={data.products} features={data.features} />

        {/* Call to Action */}
        <div className="text-center mt-6">
          <div className="gradient-primary rounded-2xl p-8 text-white animate-fade-in">
            <h3 className="text-2xl font-bold mb-4">Want different options?</h3>
            <p className="text-lg mb-6 opacity-90">Try a new search and discover more awesome picks</p>
            <Button
              onClick={() => {
                trackEvent('new_search', 'navigation', 'search_again_button');
                onNewSearch();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
