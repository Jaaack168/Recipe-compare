import puppeteer, { Browser, Page } from 'puppeteer';
import { Product, Supermarket, ScrapingResult } from '../types/index.js';
import { supermarketConfigs, categoryMappings } from './config.js';
import { DatabaseService } from '../database/connection.js';
import { createHash } from 'crypto';

export class SupermarketScraper {
  private browser: Browser | null = null;
  private db: DatabaseService;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  public async initialize(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      console.log('Puppeteer browser initialized');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  public async scrapeAllSupermarkets(): Promise<ScrapingResult[]> {
    if (!this.browser) {
      await this.initialize();
    }

    const results: ScrapingResult[] = [];
    const supermarkets: Supermarket[] = ['tesco', 'asda', 'sainsburys', 'morrisons'];

    for (const supermarket of supermarkets) {
      try {
        console.log(`Starting scraping for ${supermarket}`);
        const result = await this.scrapeSupermarket(supermarket);
        results.push(result);
        
        // Wait between supermarkets to be respectful
        await this.delay(5000);
      } catch (error) {
        console.error(`Failed to scrape ${supermarket}:`, error);
        results.push({
          supermarket,
          products_scraped: 0,
          errors: [error instanceof Error ? error.message : String(error)],
          duration_ms: 0,
          success: false
        });
      }
    }

    return results;
  }

  public async scrapeSupermarket(supermarket: Supermarket): Promise<ScrapingResult> {
    const startTime = Date.now();
    const config = supermarketConfigs[supermarket];
    if (!config) {
      throw new Error(`No configuration found for supermarket: ${supermarket}`);
    }
    
    const logId = this.db.logScrapingStart(supermarket);
    const errors: string[] = [];
    let productsScraped = 0;

    try {
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      const page = await this.browser.newPage();
      
      // Set user agent and viewport
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      // Enable request interception to block unnecessary resources
      await page.setRequestInterception(true);
      page.on('request', (req: any) => {
        const resourceType = req.resourceType();
        if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
          req.abort();
        } else {
          req.continue();
        }
      });

      const allProducts: Product[] = [];

      // Import search terms from config
      const { commonSearchTerms } = await import('./config.js');
      
      // Scrape a subset of search terms to avoid being too aggressive
      const searchTerms = commonSearchTerms.slice(0, 20); // Start with first 20 terms
      
      for (const searchTerm of searchTerms) {
        try {
          const products = await this.scrapeSearchResults(page, supermarket, searchTerm, config);
          allProducts.push(...products);
          productsScraped += products.length;
          
          // Rate limiting
          await this.delay(config.rate_limit_ms);
        } catch (error) {
          const errorMsg = `Error scraping "${searchTerm}": ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.warn(errorMsg);
        }
      }

      // Save products to database
      if (allProducts.length > 0) {
        this.db.insertProducts(allProducts);
        console.log(`Saved ${allProducts.length} products for ${supermarket}`);
      }

      await page.close();

      const duration = Date.now() - startTime;
      const success = errors.length < searchTerms.length * 0.5; // Success if less than 50% errors

      this.db.logScrapingComplete(logId, productsScraped, errors, success, duration);

      return {
        supermarket,
        products_scraped: productsScraped,
        errors,
        duration_ms: duration,
        success
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.db.logScrapingComplete(logId, productsScraped, [errorMsg], false, duration);
      
      throw error;
    }
  }

  private async scrapeSearchResults(
    page: Page, 
    supermarket: Supermarket, 
    searchTerm: string, 
    config: any
  ): Promise<Product[]> {
    const products: Product[] = [];
    const maxPages = 3; // Limit to first 3 pages per search

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const url = config.search_endpoint
          .replace('{query}', encodeURIComponent(searchTerm))
          .replace('{page}', pageNum.toString());

        console.log(`Scraping ${supermarket} page ${pageNum} for "${searchTerm}"`);
        
        await page.goto(url, { 
          waitUntil: 'networkidle2', 
          timeout: 30000 
        });

        // Wait for products to load
        try {
          await page.waitForSelector(config.selectors.product_container, { timeout: 10000 });
        } catch {
          console.log(`No products found on page ${pageNum} for "${searchTerm}"`);
          break;
        }

        // Extract product data
        const pageProducts = await page.evaluate((selectors: any, supermarket: string) => {
          const products: any[] = [];
          const productElements = document.querySelectorAll(selectors.product_container);

          productElements.forEach((element: Element) => {
            try {
              const nameElement = element.querySelector(selectors.name) as HTMLElement;
              const priceElement = element.querySelector(selectors.price) as HTMLElement;
              const imageElement = element.querySelector(selectors.image) as HTMLImageElement;
              const linkElement = element.querySelector(selectors.product_link) as HTMLAnchorElement;

              if (!nameElement || !priceElement) return;

              const name = nameElement.textContent?.trim() || '';
              const priceText = priceElement.textContent?.trim() || '';
              const imageUrl = imageElement?.src || imageElement?.getAttribute('data-src') || '';
              const productUrl = linkElement?.href || '';

              // Extract price from text (handle different formats)
              const priceMatch = priceText.match(/£?(\d+\.?\d*)/);
              const price = priceMatch ? parseFloat(priceMatch[1]) : 0;

              if (name && price > 0 && productUrl) {
                products.push({
                  name,
                  price,
                  imageUrl,
                  productUrl,
                  supermarket
                });
              }
            } catch (error) {
              console.warn('Error extracting product data:', error);
            }
          });

          return products;
        }, config.selectors, supermarket);

        // Process and format products
        for (const productData of pageProducts) {
          if (!productData.productUrl || !productData.name) continue;
          
          const product: Product = {
            id: this.generateProductId(productData.productUrl, supermarket),
            name: productData.name,
            price: productData.price,
            currency: 'GBP' as const,
            availability: 'in_stock' as const, // Default assumption
            image_url: productData.imageUrl || undefined,
            category: this.categorizeProduct(productData.name),
            supermarket,
            product_url: productData.productUrl,
            scraped_at: new Date(),
            last_updated: new Date()
          };

          products.push(product);
        }

        // Stop if no products found (reached end)
        if (pageProducts.length === 0) {
          break;
        }

        // Small delay between pages
        await this.delay(1000);

      } catch (error) {
        console.warn(`Error scraping page ${pageNum} for "${searchTerm}":`, error);
        break;
      }
    }

    return products;
  }

  private generateProductId(productUrl: string, supermarket: Supermarket): string {
    const hash = createHash('md5').update(`${supermarket}:${productUrl}`).digest('hex');
    return `${supermarket}_${hash.substring(0, 12)}`;
  }

  private categorizeProduct(productName: string): string {
    const name = productName.toLowerCase();
    
    // Simple categorization based on product name
    if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || name.includes('butter') || name.includes('egg')) {
      return 'Dairy & Eggs';
    } else if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || name.includes('fish') || name.includes('salmon') || name.includes('meat')) {
      return 'Meat & Fish';
    } else if (name.includes('apple') || name.includes('banana') || name.includes('orange') || name.includes('potato') || name.includes('carrot') || name.includes('onion')) {
      return 'Fresh Produce';
    } else if (name.includes('bread') || name.includes('cake') || name.includes('muffin') || name.includes('pastry')) {
      return 'Bakery';
    } else if (name.includes('frozen')) {
      return 'Frozen';
    } else if (name.includes('drink') || name.includes('juice') || name.includes('water') || name.includes('coffee') || name.includes('tea')) {
      return 'Beverages';
    } else {
      return 'Pantry & Canned';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
} 