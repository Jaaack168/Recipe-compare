#!/usr/bin/env tsx

import { SupermarketScraper } from '../scrapers/SupermarketScraper.js';
import { IngredientMatcher } from '../services/IngredientMatcher.js';
import { DatabaseService } from '../database/connection.js';

async function main() {
  console.log('🛒 Starting manual grocery data scraping...');
  
  const scraper = new SupermarketScraper();
  const matcher = new IngredientMatcher();
  
  try {
    // Initialize scraper
    console.log('Initializing browser...');
    await scraper.initialize();
    
    // Run scraping for all supermarkets
    console.log('Starting scraping process...');
    const results = await scraper.scrapeAllSupermarkets();
    
    // Print results
    console.log('\n📊 Scraping Results:');
    console.log('=' .repeat(50));
    
    let totalProducts = 0;
    let successfulStores = 0;
    
    for (const result of results) {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.supermarket.toUpperCase()}`);
      console.log(`   Products scraped: ${result.products_scraped}`);
      console.log(`   Duration: ${Math.round(result.duration_ms / 1000)}s`);
      console.log(`   Errors: ${result.errors.length}`);
      
      if (result.errors.length > 0) {
        console.log(`   Error details: ${result.errors.slice(0, 2).join(', ')}${result.errors.length > 2 ? '...' : ''}`);
      }
      
      totalProducts += result.products_scraped;
      if (result.success) successfulStores++;
      console.log('');
    }
    
    console.log('=' .repeat(50));
    console.log(`📈 Total products scraped: ${totalProducts}`);
    console.log(`🏪 Successful stores: ${successfulStores}/${results.length}`);
    
    // Update search indexes
    if (totalProducts > 0) {
      console.log('\n🔍 Updating search indexes...');
      await matcher.refreshAllIndexes();
      
      // Show index statistics
      const indexStats = matcher.getIndexStats();
      console.log('\n📋 Search Index Stats:');
      for (const [store, stats] of Object.entries(indexStats)) {
        console.log(`   ${store}: ${stats.products} products`);
      }
    }
    
    // Show database statistics
    const db = DatabaseService.getInstance();
    const dbStats = db.getDatabase().prepare(`
      SELECT 
        supermarket,
        COUNT(*) as total_products,
        ROUND(AVG(price), 2) as avg_price,
        MIN(last_updated) as earliest_update,
        MAX(last_updated) as latest_update
      FROM products 
      GROUP BY supermarket
    `).all();
    
    console.log('\n🗄️  Database Summary:');
    for (const stat of dbStats) {
      const typedStat = stat as { supermarket: string; total_products: number; avg_price: number };
      console.log(`   ${typedStat.supermarket}: ${typedStat.total_products} products, avg £${typedStat.avg_price}`);
    }
    
    console.log('\n✨ Scraping completed successfully!');
    
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default main; 