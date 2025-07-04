import { Check } from 'lucide-react';

interface VehicleFeaturesProps {
  features: string[];
}

export default function VehicleFeatures({ features }: VehicleFeaturesProps) {
  // Group features by category if they follow a pattern
  const categorizeFeatures = (features: string[]) => {
    const categories: Record<string, string[]> = {
      'Safety': [],
      'Comfort': [],
      'Technology': [],
      'Performance': [],
      'Exterior': [],
      'Interior': [],
      'Other': []
    };

    const safetyKeywords = ['airbag', 'safety', 'abs', 'brake', 'stability', 'traction', 'blind spot', 'collision', 'camera'];
    const comfortKeywords = ['seat', 'climate', 'heated', 'cooled', 'leather', 'memory', 'power adjustable'];
    const techKeywords = ['bluetooth', 'navigation', 'android', 'apple', 'usb', 'audio', 'screen', 'display', 'wireless'];
    const performanceKeywords = ['engine', 'turbo', 'awd', '4wd', 'sport', 'performance', 'suspension'];
    const exteriorKeywords = ['wheel', 'tire', 'roof', 'mirror', 'light', 'led', 'xenon', 'paint'];
    const interiorKeywords = ['dashboard', 'console', 'cargo', 'storage', 'cup holder'];

    features.forEach(feature => {
      const lowerFeature = feature.toLowerCase();
      
      if (safetyKeywords.some(keyword => lowerFeature.includes(keyword))) {
        categories['Safety'].push(feature);
      } else if (comfortKeywords.some(keyword => lowerFeature.includes(keyword))) {
        categories['Comfort'].push(feature);
      } else if (techKeywords.some(keyword => lowerFeature.includes(keyword))) {
        categories['Technology'].push(feature);
      } else if (performanceKeywords.some(keyword => lowerFeature.includes(keyword))) {
        categories['Performance'].push(feature);
      } else if (exteriorKeywords.some(keyword => lowerFeature.includes(keyword))) {
        categories['Exterior'].push(feature);
      } else if (interiorKeywords.some(keyword => lowerFeature.includes(keyword))) {
        categories['Interior'].push(feature);
      } else {
        categories['Other'].push(feature);
      }
    });

    // Remove empty categories
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0) {
        delete categories[key];
      }
    });

    return categories;
  };

  const categorizedFeatures = categorizeFeatures(features);
  const hasCategories = Object.keys(categorizedFeatures).length > 1;

  return (
    <div className="bg-tertiary-dark rounded-lg shadow-sm p-6 transition-all duration-200">
      <h2 className="text-xl font-semibold text-white mb-4">Features & Options</h2>
      
      {hasCategories ? (
        <div className="space-y-6">
          {Object.entries(categorizedFeatures).map(([category, categoryFeatures]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">{category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categoryFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}