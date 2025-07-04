interface VehiclePricingProps {
  price?: number;
  salePrice?: number;
  msrp?: number;
}

export default function VehiclePricing({ price, salePrice, msrp }: VehiclePricingProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const displayPrice = salePrice || price;
  const savings = msrp && displayPrice ? msrp - displayPrice : null;
  const savingsPercentage = msrp && savings ? Math.round((savings / msrp) * 100) : null;

  if (!displayPrice) {
    return (
      <div className="bg-tertiary-dark rounded-lg shadow-sm p-6 transition-all duration-200">
        <h2 className="text-xl font-semibold text-white mb-4">Pricing</h2>
        <p className="text-gray-400">Contact for pricing</p>
      </div>
    );
  }

  return (
    <div className="bg-tertiary-dark rounded-lg shadow-sm p-6 transition-all duration-200">
      <h2 className="text-xl font-semibold text-white mb-4">Pricing</h2>
      
      <div className="space-y-3">
        {/* Main Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-white">
            {formatPrice(displayPrice)}
          </span>
          {salePrice && price && salePrice < price && (
            <span className="text-lg text-gray-400 line-through">
              {formatPrice(price)}
            </span>
          )}
        </div>

        {/* MSRP and Savings */}
        {msrp && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">MSRP:</span>
              <span className="text-gray-100">{formatPrice(msrp)}</span>
            </div>
            
            {savings && savings > 0 && (
              <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-green-300 font-semibold">You Save:</span>
                  <div className="text-right">
                    <span className="text-green-300 font-bold text-lg">
                      {formatPrice(savings)}
                    </span>
                    {savingsPercentage && (
                      <span className="text-green-400 text-sm ml-2">
                        ({savingsPercentage}% off)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sale Badge */}
        {salePrice && (
          <div className="inline-flex items-center gap-2 bg-red-900/20 text-red-300 px-3 py-1 rounded-full text-sm font-semibold transition-all duration-200">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
              <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
            </svg>
            Special Price
          </div>
        )}
      </div>
    </div>
  );
}