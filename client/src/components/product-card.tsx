import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Star, Check, Minus, X } from "lucide-react";
import type { ComparisonResult } from "@shared/schema";
import { trackEvent } from "@/lib/analytics";

interface ProductCardProps {
  product: ComparisonResult;
  index: number;
}

const gradients = [
  "gradient-primary",
  "gradient-blue", 
  "gradient-green",
  "gradient-orange",
  "gradient-pink"
];

const badgeColors = {
  green: "bg-green-100 text-green-800",
  blue: "bg-blue-100 text-blue-800", 
  orange: "bg-orange-100 text-orange-800",
  purple: "bg-purple-100 text-purple-800"
};

export default function ProductCard({ product, index }: ProductCardProps) {
  const gradientClass = gradients[index] || "gradient-primary";
  const badgeColorClass = badgeColors[product.badgeColor as keyof typeof badgeColors] || "bg-blue-100 text-blue-800";

  const getFeatureIcon = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="text-green-500" size={16} />
      ) : (
        <X className="text-red-400" size={16} />
      );
    }
    
    if (typeof value === "string") {
      if (value.toLowerCase().includes("limited") || value.toLowerCase().includes("partial")) {
        return <Minus className="text-yellow-500" size={16} />;
      }
      return <Check className="text-green-500" size={16} />;
    }
    
    return <Minus className="text-gray-400" size={16} />;
  };

  return (
    <Card className="hover-lift bg-gradient-to-br from-white via-gray-50 to-purple-50 rounded-2xl shadow-lg p-6 animate-slide-up flex flex-col h-full border border-purple-100">
      <CardContent className="p-0 flex flex-col flex-grow">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
          <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
          {product.badge && (
            <Badge className={`${badgeColorClass} px-3 py-1 rounded-full text-sm font-semibold mb-4`}>
              <Check className="mr-1" size={12} />
              {product.badge}
            </Badge>
          )}
        </div>
        
        <div className="space-y-3 mb-6 flex-grow">
          {/* Key Information - Always shown */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <span className="text-gray-700 font-medium">Pricing</span>
            {product.pricing ? (
              <span className="font-bold text-gray-900">{product.pricing}</span>
            ) : (
              <span className="text-gray-400 text-xs">Not provided</span>
            )}
          </div>

          
          {/* Top 2 Most Important Features */}
          {product.features && Object.entries(product.features).slice(0, 2).map(([feature, value]) => (
            <div key={feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 capitalize">{feature}</span>
              <div className="flex items-center">
                {getFeatureIcon(value)}
                {typeof value === "string" && !["true", "false"].includes(value.toLowerCase()) && (
                  <span className="ml-2 text-sm text-gray-700">{value}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto">
          <Button
            asChild
            className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl`}
          >
            <a 
              href={product.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center"
              onClick={() => trackEvent('product_click', 'outbound', product.name)}
            >
              <ExternalLink className="mr-2" size={16} />
              Visit {product.name}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
