import { Brain, Loader2 } from "lucide-react";

export default function LoadingState() {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="bg-white rounded-2xl shadow-lg p-12">
          <div className="animate-pulse-slow mb-6">
            <Brain className="text-blue-500 mx-auto" size={64} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">AI is searching for the best options...</h3>
          <p className="text-gray-600 mb-8">Analyzing thousands of products to find your perfect matches</p>
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          </div>
          <div className="mt-8 max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Searching products...</span>
              <span>●●●</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
