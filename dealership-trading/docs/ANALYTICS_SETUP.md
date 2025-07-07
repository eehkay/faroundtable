# Analytics Feature Setup Guide

## Overview

The Round Table Analytics feature provides market intelligence and insights for your dealership inventory using Market Check and DataForSEO APIs. This guide will help you set up and configure the analytics features.

## Prerequisites

1. **Market Check API Key**: Sign up at [marketcheck.com](https://www.marketcheck.com/) to get your API key
2. **DataForSEO Account**: Create an account at [dataforseo.com](https://dataforseo.com/) to get your login credentials
3. **Database Migration**: Run the analytics database migration to create necessary tables

## Setup Steps

### 1. Environment Variables

Add the following variables to your `.env.local` file:

```bash
# Enable analytics features
ENABLE_ADVANCED_ANALYTICS=true

# Market Check API
MARKETCHECK_API_KEY=your_marketcheck_api_key_here

# DataForSEO API
DATAFORSEO_EMAIL=your_dataforseo_email
DATAFORSEO_API_KEY=your_dataforseo_api_key

# Optional: Customize cache duration (default: 24 hours)
ANALYTICS_CACHE_TTL_HOURS=24
```

### 2. Run Database Migration

Apply the analytics database migration:

```bash
# Using Supabase CLI
supabase db push

# Or apply manually via Supabase dashboard
# Upload: supabase/migrations/20250706174632_add_analytics_tables.sql
```

### 3. Verify Setup

1. Restart your development server
2. Navigate to `/analytics` in your application
3. The analytics menu should now be visible in the navigation

## Features

### Vehicle Market Analysis
- Analyze any vehicle by VIN or make/model/year
- Get real-time pricing data and market trends
- View demand metrics and search volume
- Receive actionable recommendations

### Regional Market Insights
- Understand popular vehicles in your area
- Analyze competitor landscape
- Identify market opportunities
- Track regional pricing trends

### Analytics Reports (Coming Soon)
- Create custom reports
- Schedule automated analytics
- Export insights for sharing

## API Usage and Limits

### Market Check API
- **Rate Limit**: 1,000 requests per hour
- **Endpoints Used**:
  - Vehicle search and inventory
  - Regional statistics
  - Dealer information

### DataForSEO API
- **Rate Limit**: 2,000 requests per day
- **Endpoints Used**:
  - Search volume data
  - Keyword suggestions
  - Local search trends

## Caching Strategy

To minimize API costs and improve performance:
- Vehicle analysis results are cached for 24 hours
- Regional insights are cached for 12 hours
- Cache is stored in the `analytics_cache` table
- Force refresh available by adding `?refresh=true` to API calls

## Monitoring Usage

Track your API usage in the `analytics_usage` table:

```sql
-- View daily API usage
SELECT 
  DATE(created_at) as date,
  COUNT(*) as requests,
  SUM((api_calls->>'marketcheck')::int) as marketcheck_calls,
  SUM((api_calls->>'dataforseo')::int) as dataforseo_calls,
  AVG(response_time_ms) as avg_response_time
FROM analytics_usage
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Troubleshooting

### Analytics menu not visible
- Ensure `ENABLE_ADVANCED_ANALYTICS=true` is set
- Restart your development server
- Check browser console for errors

### API errors
- Verify your API credentials are correct
- Check API rate limits haven't been exceeded
- Review server logs for detailed error messages

### Slow performance
- Check cache hit rates in `analytics_usage` table
- Increase `ANALYTICS_CACHE_TTL_HOURS` if appropriate
- Monitor API response times

## Security Considerations

- API keys are server-side only, never exposed to clients
- All analytics endpoints require authentication
- Regional insights respect user location permissions
- Usage is tracked per user for auditing

## Future Enhancements

- Predictive analytics using ML models
- Automated market alerts
- Custom dashboard builder
- Mobile app support
- Additional data provider integrations