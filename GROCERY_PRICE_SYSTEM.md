# Grocery Price Comparison System

## Overview

A comprehensive grocery product data scraping and price comparison system integrated into the Recipe Compare app. This system automatically scrapes product data from major UK supermarkets and provides intelligent price comparisons for recipe ingredients.

## 🏪 Supported Supermarkets

- **Tesco** - Full product catalog with pricing
- **ASDA** - Complete store inventory 
- **Sainsbury's** - Product range and availability
- **Morrisons** - Store prices and stock levels

## 🚀 Features Implemented

### Backend Infrastructure
- **Express.js API Server** (Port 3001) with TypeScript
- **SQLite Database** for product storage and caching
- **Puppeteer Web Scraping** with rate limiting and respectful practices
- **Fuse.js Fuzzy Matching** for intelligent ingredient-to-product mapping
- **Automated Cron Jobs** for data refreshing (every 48 hours)
- **Price History Tracking** with trend analysis
- **Postcode-based Store Location** lookup

### Frontend Integration
- **StoreComparisonTable Component** - React component for price display
- **Real-time Price Fetching** - Live API integration
- **Fallback Pricing Logic** - Estimated prices when products unavailable
- **Interactive Cart Integration** - Compare prices for selected items
- **Postcode Validation** - UK postcode format checking

## 📋 API Endpoints

### Core Endpoints
- `POST /api/compare-prices` - Compare ingredient prices across stores
- `GET /api/products/search?q=<query>` - Search products by name
- `GET /api/products/category/<category>` - Get products by category
- `GET /api/price-changes?days=<days>` - Recent price changes
- `GET /api/stats` - Store statistics and metrics

### Development Endpoints
- `GET /api/health` - Health check
- `POST /api/test-match` - Test ingredient matching

## 🔧 Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Setup
```bash
npm install axios  # For API calls
npm run dev
```

### 3. Environment Configuration
Create `backend/.env`:
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DB_PATH=./data/products.db
ENABLE_CRON=false  # Set to true for production
```

## 📊 Usage Examples

### 1. Basic Price Comparison
```javascript
// POST /api/compare-prices
{
  "ingredients": ["tomatoes", "chicken breast", "pasta"],
  "postcode": "SW1A 1AA",
  "radius_miles": 10
}
```

**Response:**
```javascript
{
  "stores": [
    {
      "supermarket": "tesco",
      "total_cost": 12.50,
      "estimated_total": false,
      "ingredient_matches": [...],
      "missing_ingredients": [],
      "store_location": {
        "name": "Tesco Superstore",
        "address": "Near SW1A 1AA",
        "distance_miles": 2.3
      }
    }
  ],
  "comparison_timestamp": "2025-01-07T13:00:00.000Z"
}
```

### 2. Frontend Integration
```tsx
import StoreComparisonTable from '../components/StoreComparisonTable';

function RecipePage() {
  const ingredients = ['chicken', 'rice', 'vegetables'];
  const postcode = 'W1A 0AX';
  
  return (
    <StoreComparisonTable 
      ingredients={ingredients}
      postcode={postcode}
    />
  );
}
```

## 🗄️ Database Schema

### Products Table
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  currency TEXT DEFAULT 'GBP',
  availability TEXT CHECK(availability IN ('in_stock', 'out_of_stock', 'limited_stock')),
  image_url TEXT,
  category TEXT,
  supermarket TEXT NOT NULL,
  product_url TEXT,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Price History Table
```sql
CREATE TABLE price_history (
  id INTEGER PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  price REAL NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🤖 Data Collection Process

### Automated Scraping
- **Schedule**: Every 48 hours (configurable)
- **Rate Limiting**: 2-second delays between requests
- **Respectful Practices**: User-agent rotation, resource blocking
- **Error Handling**: Comprehensive logging and retry logic

### Manual Scraping
```bash
cd backend
npm run scrape  # Run manual scraping for testing
```

## 🔍 Intelligent Matching

### Fuse.js Configuration
- **Fuzzy Search**: Handles typos and variations
- **Confidence Scoring**: Match quality assessment
- **Caching System**: Fast repeated lookups
- **Fallback Logic**: Estimated pricing when no matches

### Example Matches
- "chicken breast" → "Fresh British Chicken Breast Fillets"
- "tomatoe" → "Cherry Tomatoes" (typo handling)
- "pasta" → "Fusilli Pasta 500g" (category matching)

## 🚨 Error Handling & Fallbacks

### API Resilience
- **Connection Errors**: Graceful degradation to mock data
- **Missing Products**: Estimated pricing based on category
- **Invalid Postcodes**: Format validation with helpful errors
- **Rate Limiting**: Automatic backoff and retry

### Frontend Fallbacks
- **Loading States**: Skeleton components during fetch
- **Error Messages**: User-friendly error display
- **Offline Mode**: Cached data when API unavailable
- **Estimation Tags**: Clear indication of estimated vs. real prices

## 📈 Performance Optimizations

### Backend
- **Database Indexing**: Fast product queries
- **Request Caching**: Reduced API response times
- **Background Jobs**: Non-blocking data updates
- **Resource Optimization**: Blocked images/CSS during scraping

### Frontend
- **Lazy Loading**: Components load only when needed
- **Debounced Requests**: Reduced API calls
- **Local Storage**: Cart persistence
- **Optimistic Updates**: Immediate UI feedback

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test  # Unit tests for services
npm run test:integration  # API endpoint tests
```

### Frontend Tests
```bash
npm test  # Component tests
npm run test:e2e  # End-to-end tests
```

## 🔄 Maintenance

### Daily Operations
- **Health Monitoring**: `/api/health` endpoint
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: API response times
- **Data Freshness**: Automatic scraping status

### Database Maintenance
- **Weekly Cleanup**: Remove outdated products
- **Daily Backups**: Automatic data backup
- **Index Refresh**: Search optimization
- **Price History**: Archive old data

## 🚀 Deployment

### Production Setup
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
npm run build
npm run preview
```

### Environment Variables
```env
NODE_ENV=production
ENABLE_CRON=true
DB_PATH=/app/data/products.db
LOG_LEVEL=warn
```

## 📝 Next Steps

### Potential Enhancements
1. **Real Store Locations** - Integration with store locator APIs
2. **Price Alerts** - Notifications for price drops
3. **Nutritional Data** - Product nutrition information
4. **Recipe Optimization** - Suggest ingredient substitutions for cost savings
5. **Mobile App** - Native mobile application
6. **User Accounts** - Personalized shopping lists and preferences

### Known Limitations
- **Scraping Reliability**: Dependent on website structure stability
- **Geographic Coverage**: Currently UK-focused
- **Real-time Pricing**: Updates every 48 hours
- **Product Availability**: May not reflect real-time stock levels

## 🔧 Technical Details

### Architecture
```
Frontend (React/TypeScript) ←→ Backend API (Express/TypeScript) ←→ SQLite Database
                                        ↓
                              Puppeteer Scrapers ←→ Supermarket Websites
                                        ↓
                                Fuse.js Matching Engine
```

### Data Flow
1. **User Request** → Frontend component
2. **API Call** → Backend price comparison service
3. **Database Query** → Product lookup and matching
4. **Fuzzy Matching** → Intelligent ingredient mapping
5. **Price Calculation** → Store-specific totals
6. **Response** → Formatted comparison data
7. **UI Update** → Interactive price table

This system provides a robust foundation for grocery price comparison with automated data collection, intelligent matching, and comprehensive error handling. 