import { Check, X, Minus, Info } from "lucide-react";
import type { ComparisonResult } from "@shared/schema";

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
    return product.features[feature];
  };

  // Separate key features from other features
  const keyFeatures = ["Pricing", "User Rating"];
  const otherFeatures = features.filter(f => !keyFeatures.includes(f));

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-slide-up">
      <div className="gradient-primary p-6">
        <h3 className="text-2xl font-bold text-white text-center flex items-center justify-center">
          <svg className="mr-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Detailed Feature Comparison
        </h3>
      </div>
      
      {/* Combined Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
            <tr>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Feature</th>
              {products.map((product) => (
                <th key={product.name} className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                  {product.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* Key Information Section Header */}
            <tr className="bg-blue-50">
              <td colSpan={products.length + 1} className="px-6 py-3 text-left text-sm font-bold text-gray-800">
                Key Information
              </td>
            </tr>
            {/* Pricing Row */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-gray-900 text-center">Pricing</td>
              {products.map((product) => (
                <td key={`${product.name}-pricing`} className="px-6 py-4 text-center">
                  <span className="font-semibold text-blue-600">{product.pricing}</span>
                </td>
              ))}
            </tr>
            {/* User Rating Row */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-gray-900 text-center">User Rating</td>
              {products.map((product) => (
                <td key={`${product.name}-rating`} className="px-6 py-4 text-center">
                  {product.rating ? (
                    <div className="flex items-center justify-center">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span className="font-semibold">{product.rating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">No data</span>
                  )}
                </td>
              ))}
            </tr>
            {/* Additional Features Section Header */}
            {otherFeatures.length > 0 && (
              <tr className="bg-blue-50">
                <td colSpan={products.length + 1} className="px-6 py-3 text-left text-sm font-bold text-gray-800">
                  Additional Features
                </td>
              </tr>
            )}
            {/* Other Features Rows */}
            {otherFeatures.map((feature) => (
              <tr key={feature} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 text-center">
                  {feature}
                </td>
                {products.map((product) => {
                  const value = getFeatureValue(product, feature);
                  return (
                    <td key={`${product.name}-${feature}`} className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        {getFeatureIcon(value)}
                        {typeof value === "string" && !["true", "false"].includes(value.toLowerCase()) && (
                          <span className="ml-2 text-xs text-gray-600 max-w-20 truncate">
                            {value}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-600 flex items-center justify-center flex-wrap gap-4">
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
      </div>
    </div>
  );
}
