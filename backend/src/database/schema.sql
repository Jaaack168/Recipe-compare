-- Products table for storing scraped grocery data
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    currency TEXT DEFAULT 'GBP',
    availability TEXT CHECK(availability IN ('in_stock', 'out_of_stock', 'limited_stock')) NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    brand TEXT,
    size TEXT,
    unit TEXT,
    supermarket TEXT CHECK(supermarket IN ('tesco', 'asda', 'sainsburys', 'morrisons')) NOT NULL,
    product_url TEXT NOT NULL,
    scraped_at DATETIME NOT NULL,
    last_updated DATETIME NOT NULL,
    UNIQUE(product_url, supermarket)
);

-- Scraping logs for monitoring and debugging
CREATE TABLE IF NOT EXISTS scraping_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supermarket TEXT NOT NULL,
    started_at DATETIME NOT NULL,
    completed_at DATETIME,
    products_scraped INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    error_details TEXT,
    success BOOLEAN DEFAULT FALSE,
    duration_ms INTEGER
);

-- Price history for tracking price changes over time
CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    price REAL NOT NULL,
    availability TEXT NOT NULL,
    recorded_at DATETIME NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Ingredient matching cache for faster lookups
CREATE TABLE IF NOT EXISTS ingredient_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient_name TEXT NOT NULL,
    product_id TEXT NOT NULL,
    confidence REAL NOT NULL,
    score REAL NOT NULL,
    supermarket TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_supermarket ON products(supermarket);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_availability ON products(availability);
CREATE INDEX IF NOT EXISTS idx_products_last_updated ON products(last_updated);

CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(recorded_at);

CREATE INDEX IF NOT EXISTS idx_ingredient_matches_ingredient ON ingredient_matches(ingredient_name);
CREATE INDEX IF NOT EXISTS idx_ingredient_matches_supermarket ON ingredient_matches(supermarket);
CREATE INDEX IF NOT EXISTS idx_ingredient_matches_score ON ingredient_matches(score);

-- View for latest product prices with history
CREATE VIEW IF NOT EXISTS products_with_history AS
SELECT 
    p.*,
    ph.price as previous_price,
    ph.recorded_at as previous_price_date,
    CASE 
        WHEN ph.price IS NOT NULL THEN 
            ROUND(((p.price - ph.price) / ph.price) * 100, 2)
        ELSE 0 
    END as price_change_percent
FROM products p
LEFT JOIN (
    SELECT 
        product_id,
        price,
        recorded_at,
        ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY recorded_at DESC) as rn
    FROM price_history
) ph ON p.id = ph.product_id AND ph.rn = 1; 