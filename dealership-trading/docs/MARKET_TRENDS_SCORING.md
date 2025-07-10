# Market Trends Report Scoring Strategy

## Overview

The Market Trends Report provides a comprehensive analysis of vehicle marketability through a multi-dimensional scoring system. This document explains how the **Opportunity Score** is calculated and what each component represents.

## Opportunity Score (0-100%)

The Opportunity Score is a weighted composite of four key market factors that indicate the overall sales potential for a vehicle. A higher score suggests better market conditions and sales opportunities.

### Score Interpretation
- **80-100%**: Excellent opportunity - Strong buy/hold recommendation
- **60-79%**: Good opportunity - Solid market position
- **40-59%**: Moderate opportunity - Monitor closely
- **0-39%**: Poor opportunity - Consider price adjustments or transfers

## Score Components

### 1. Price Competitiveness (25% weight)
Evaluates how well the vehicle is priced relative to market conditions.

**Calculation Logic:**
- **100%**: Priced below market average (great value)
- **80%**: At lower end of market range
- **60%**: Within market range
- **40%**: At upper end of market range
- **20%**: Above market range
- **0%**: Significantly overpriced

**Data Sources:**
- Market Check API pricing data
- Regional price comparisons
- Percentile ranking within market

### 2. Inventory Scarcity (25% weight)
Measures the supply-demand balance based on market inventory levels.

**Calculation Logic:**
- **100%**: Extremely low inventory (<30 days supply)
- **80%**: Low inventory (30-60 days)
- **60%**: Balanced inventory (60-90 days)
- **40%**: High inventory (90-120 days)
- **20%**: Oversupplied (>120 days)

**Key Metrics:**
- Market day supply
- Monthly sales velocity
- Inventory turnover rate

### 3. Regional Demand (25% weight)
Assesses local market interest through search volume analysis.

**Calculation Logic:**
- **High Demand (80-100%)**: >10,000 monthly searches
- **Medium Demand (50-79%)**: 3,000-10,000 searches
- **Low Demand (0-49%)**: <3,000 searches

**Additional Factors:**
- Search trend (rising/declining)
- Keyword competition levels
- Location-specific multipliers

### 4. Market Timing (25% weight)
Evaluates current market conditions and trends.

**Calculation Logic:**
- **100%**: Rapidly increasing demand, low days on market
- **80%**: Stable high demand, normal turnover
- **60%**: Moderate conditions
- **40%**: Slowing market
- **20%**: Declining market conditions

**Indicators:**
- Average days on market
- Sales trend analysis
- Seasonal adjustments

## Composite Score Calculation

```
Opportunity Score = (
    (Price Competitiveness × 0.25) +
    (Inventory Scarcity × 0.25) +
    (Regional Demand × 0.25) +
    (Market Timing × 0.25)
)
```

## Recommendations Engine

Based on the Opportunity Score and individual components, the system generates actionable recommendations:

### Pricing Recommendations
- **Score ≥ 80%**: "Maintain current pricing - strong market position"
- **Score 60-79%**: "Consider minor adjustments to optimize position"
- **Score 40-59%**: "Review pricing strategy against competition"
- **Score <40%**: "Aggressive repricing recommended"

### Inventory Recommendations
- **High Scarcity**: "Low inventory creates urgency - capitalize on scarcity"
- **Balanced**: "Healthy inventory levels - focus on differentiation"
- **Oversupplied**: "Consider transfers or promotional strategies"

### Marketing Recommendations
- **High Demand**: "Leverage high search volume with targeted ads"
- **Rising Trend**: "Increase marketing spend to capture growing interest"
- **Low Demand**: "Focus on niche targeting or consider alternative markets"

## Data Quality Indicators

The report includes confidence levels based on data availability:
- **High Confidence**: >20 comparable vehicles in dataset
- **Medium Confidence**: 10-20 comparables
- **Low Confidence**: <10 comparables

## API Integration

The scoring system integrates data from multiple sources:
1. **Market Check API**: Pricing, inventory, and competition data
2. **DataForSEO API**: Search volume and keyword analytics
3. **Internal Database**: Historical performance and location data

## Best Practices

1. **Regular Updates**: Scores should be refreshed daily as market conditions change
2. **Multi-Location Analysis**: Compare scores across different dealership locations
3. **Trend Monitoring**: Track score changes over time to identify market shifts
4. **Action Thresholds**: Set automated alerts for scores dropping below 60%

## Future Enhancements

Planned improvements to the scoring algorithm:
- Machine learning-based price predictions
- Competitor behavior analysis
- Customer demographic integration
- Seasonal demand patterns
- Economic indicator correlations