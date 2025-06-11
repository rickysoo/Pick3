import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import SearchForm from "@/components/search-form";
import LoadingState from "@/components/loading-state";
import ComparisonResults from "@/components/comparison-results";
import { Scale, Award, Users, TrendingUp } from "lucide-react";
import type { ComparisonResponse } from "@shared/schema";
import p3Logo from "@assets/pick3-logo_1749654342574.png";

export default function Home() {
  const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const searchFormRef = useRef<HTMLDivElement>(null);

  const compareProductsMutation = useMutation({
    mutationFn: async (searchData: any) => {
      const response = await apiRequest("POST", "/api/compare", searchData);
      return await response.json();
    },
    onSuccess: (data) => {
      setComparisonData(data);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
  });

  const handleSearch = (searchData: any) => {
    compareProductsMutation.mutate(searchData);
  };

  const scrollToSearch = () => {
    searchFormRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <img 
                src={p3Logo} 
                alt="Pick3 Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                Pick3
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="animate-fade-in">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
              Find Your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Perfect Brand</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
              🤔 Can't decide? We get you the top 3. You pick the winner!
            </p>
          </div>

          {/* Search Form */}
          <div ref={searchFormRef}>
            <SearchForm onSearch={handleSearch} isLoading={compareProductsMutation.isPending} />
          </div>


        </div>
      </section>

      {/* Loading State */}
      {compareProductsMutation.isPending && <LoadingState />}

      {/* Error State */}
      {compareProductsMutation.error && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-red-900 mb-2">Oops!</h3>
              <p className="text-red-700 mb-4">
                {compareProductsMutation.error instanceof Error 
                  ? compareProductsMutation.error.message 
                  : "Something went wrong. Let's try that again!"}
              </p>
              <button
                onClick={() => compareProductsMutation.reset()}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Comparison Results */}
      {comparisonData && (
        <section ref={resultsRef}>
          <ComparisonResults data={comparisonData} onNewSearch={scrollToSearch} />
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 sm:py-8 mt-12 sm:mt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <img 
              src={p3Logo} 
              alt="Pick3 Logo" 
              className="w-6 h-6 sm:w-8 sm:h-8"
            />
            <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">Pick3</h3>
          </div>
          <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">Your decisions made easy ⚡</p>
          <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">
            Level up your AI game? <a 
              href="https://AICoach.my" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors underline"
            >
              Learn AI
            </a>
          </p>

        </div>
      </footer>
    </div>
  );
}
