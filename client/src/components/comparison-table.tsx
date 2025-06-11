import { Check, X, Minus, Info } from "lucide-react";
import type { ComparisonResult } from "@shared/schema";
import { trackEvent } from "@/lib/analytics";

interface ComparisonTableProps {
  products: ComparisonResult[];
  features: string[];
}

export default function ComparisonTable({ products, features }: ComparisonTableProps) {
  const getFeatureIcon = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="text-green-500" size={20} />
      ) : (
        <X className="text-red-400" size={20} />
      );
    }
    
    if (typeof value === "string") {
      if (value.toLowerCase().includes("limited") || value.toLowerCase().includes("partial")) {
        return <Minus className="text-yellow-500" size={20} />;
      }
      return <Check className="text-green-500" size={20} />;
    }
    
    return <Minus className="text-gray-400" size={20} />;
  };

  const getFeatureValue = (product: ComparisonResult, feature: string) => {
    return product.features && product.features[feature];
  };

  // Separate key features from other features
  const keyFeatures = ["Pricing", "User Rating"];
  const otherFeatures = features ? features.filter(f => !keyFeatures.includes(f)) : [];

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-slide-up">
      <div className="gradient-primary p-4 sm:p-6">
        <h3 className="text-xl sm:text-2xl font-bold text-white text-center flex items-center justify-center">
          <svg className="mr-2 h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Detailed Comparison
        </h3>
      </div>
      
      {/* Mobile-optimized Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 min-w-[120px]"></th>
              {products.map((product) => (
                <th key={product.name} className="px-2 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-900 min-w-[100px]">
                  <div className="truncate" title={product.name}>
                    {product.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* Key Information Section Header */}
            <tr className="bg-blue-50">
              <td colSpan={products.length + 1} className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold text-gray-800">
                Key Information
              </td>
            </tr>
            {/* Pricing Row */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 text-left">Pricing</td>
              {products.map((product) => (
                <td key={`${product.name}-pricing`} className="px-2 sm:px-4 py-3 sm:py-4 text-center">
                  {product.pricing ? (
                    <span className="font-semibold text-blue-600 text-xs sm:text-sm">{product.pricing}</span>
                  ) : (
                    <span className="text-gray-400 text-xs">Not provided</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Additional Features Section Header */}
            {otherFeatures.length > 0 && (
              <tr className="bg-blue-50">
                <td colSpan={products.length + 1} className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold text-gray-800">
                  Additional Features
                </td>
              </tr>
            )}
            {/* Other Features Rows */}
            {otherFeatures.map((feature) => (
              <tr key={feature} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 text-left">
                  {feature}
                </td>
                {products.map((product) => {
                  const value = getFeatureValue(product, feature);
                  return (
                    <td key={`${product.name}-${feature}`} className="px-2 sm:px-4 py-3 sm:py-4 text-center">
                      <div className="flex items-center justify-center">
                        {getFeatureIcon(value)}
                        {typeof value === "string" && !["true", "false"].includes(value.toLowerCase()) && (
                          <span className="ml-1 sm:ml-2 text-xs text-gray-600 max-w-16 sm:max-w-20 truncate">
                            {value}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            
            {/* Sources Row */}
            <tr className="bg-yellow-50 border-t-2 border-yellow-200">
              <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 text-left">Verify Information</td>
              {products.map((product) => (
                <td key={`${product.name}-source`} className="px-2 sm:px-4 py-3 sm:py-4 text-center">
                  {product.website && product.website !== "#" ? (
                    <a 
                      href={product.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 underline"
                      onClick={() => trackEvent('table_website_click', 'outbound', product.name)}
                    >
                      <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span className="hidden sm:inline">Official Website</span>
                      <span className="sm:hidden">Visit</span>
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">No website</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-600 flex items-center justify-center flex-wrap gap-4 mb-4">
          <Info className="mr-2 h-4 w-4" />
          <strong>Legend:</strong> 
          <span className="inline-flex items-center">
            <Check className="text-green-500 mr-1" size={16} /> Full Support
          </span>
          <span className="inline-flex items-center">
            <Minus className="text-yellow-500 mr-1" size={16} /> Limited Support
          </span>
          <span className="inline-flex items-center">
            <X className="text-red-400 mr-1" size={16} /> Not Available
          </span>
        </p>
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-3 inline-block">
            <svg className="inline mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <strong>Disclaimer:</strong> All comparison data is AI-generated and may contain inaccuracies. 
            Please verify information with official sources before making purchasing decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
