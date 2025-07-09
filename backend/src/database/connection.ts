import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DatabaseService {
  private db: Database.Database;
  private static instance: DatabaseService;

  private constructor() {
    const dbPath = process.env.DB_PATH || join(process.cwd(), 'data', 'products.db');
    
    // Ensure data directory exists
    const dataDir = dirname(dbPath);
    mkdirSync(dataDir, { recursive: true });

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = 1000');
    
    this.initializeSchema();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private initializeSchema(): void {
    try {
      const schemaPath = join(__dirname, 'schema.sql');
      const schema = readFileSync(schemaPath, 'utf-8');
      this.db.exec(schema);
      console.log('Database schema initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database schema:', error);
      throw error;
    }
  }

  public getDatabase(): Database.Database {
    return this.db;
  }

  // Product operations
  public insertProduct(product: any): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO products (
        id, name, price, currency, availability, image_url, category, 
        subcategory, brand, size, unit, supermarket, product_url, 
        scraped_at, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      product.id,
      product.name,
      product.price,
      product.currency || 'GBP',
      product.availability,
      product.image_url,
      product.category,
      product.subcategory,
      product.brand,
      product.size,
      product.unit,
      product.supermarket,
      product.product_url,
      product.scraped_at,
      product.last_updated
    );
  }

  public insertProducts(products: any[]): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO products (
        id, name, price, currency, availability, image_url, category, 
        subcategory, brand, size, unit, supermarket, product_url, 
        scraped_at, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction((products: any[]) => {
      for (const product of products) {
        stmt.run(
          product.id,
          product.name,
          product.price,
          product.currency || 'GBP',
          product.availability,
          product.image_url,
          product.category,
          product.subcategory,
          product.brand,
          product.size,
          product.unit,
          product.supermarket,
          product.product_url,
          product.scraped_at,
          product.last_updated
        );
      }
    });

    transaction(products);
  }

  public getProductsBySupermarket(supermarket: string): any[] {
    const stmt = this.db.prepare('SELECT * FROM products WHERE supermarket = ? ORDER BY name');
    return stmt.all(supermarket);
  }

  public searchProducts(query: string, supermarket?: string): any[] {
    let sql = 'SELECT * FROM products WHERE name LIKE ?';
    const params: any[] = [`%${query}%`];

    if (supermarket) {
      sql += ' AND supermarket = ?';
      params.push(supermarket);
    }

    sql += ' ORDER BY name LIMIT 100';
    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  // Scraping log operations
  public logScrapingStart(supermarket: string): number {
    const stmt = this.db.prepare(`
      INSERT INTO scraping_logs (supermarket, started_at)
      VALUES (?, datetime('now'))
    `);
    const result = stmt.run(supermarket);
    return result.lastInsertRowid as number;
  }

  public logScrapingComplete(logId: number, productsScraped: number, errors: string[], success: boolean, durationMs: number): void {
    const stmt = this.db.prepare(`
      UPDATE scraping_logs 
      SET completed_at = datetime('now'), 
          products_scraped = ?, 
          errors_count = ?, 
          error_details = ?, 
          success = ?, 
          duration_ms = ?
      WHERE id = ?
    `);
    
    stmt.run(
      productsScraped,
      errors.length,
      errors.length > 0 ? JSON.stringify(errors) : null,
      success,
      durationMs,
      logId
    );
  }

  // Price history operations
  public addPriceHistory(productId: string, price: number, availability: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO price_history (product_id, price, availability, recorded_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    stmt.run(productId, price, availability);
  }

  // Ingredient matching cache
  public cacheIngredientMatch(ingredient: string, productId: string, confidence: number, score: number, supermarket: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ingredient_matches 
      (ingredient_name, product_id, confidence, score, supermarket, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(ingredient, productId, confidence, score, supermarket);
  }

  public getCachedMatches(ingredient: string, supermarket?: string): any[] {
    let sql = `
      SELECT im.*, p.name, p.price, p.availability, p.image_url, p.category
      FROM ingredient_matches im
      JOIN products p ON im.product_id = p.id
      WHERE im.ingredient_name = ?
    `;
    const params: any[] = [ingredient];

    if (supermarket) {
      sql += ' AND im.supermarket = ?';
      params.push(supermarket);
    }

    sql += ' ORDER BY im.score DESC, im.confidence DESC LIMIT 10';
    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  // Cleanup operations
  public cleanupOldData(daysOld: number = 30): void {
    const cleanupDate = new Date();
    cleanupDate.setDate(cleanupDate.getDate() - daysOld);

    // Remove old price history
    const priceHistoryStmt = this.db.prepare(`
      DELETE FROM price_history 
      WHERE recorded_at < datetime(?)
    `);
    priceHistoryStmt.run(cleanupDate.toISOString());

    // Remove old ingredient matches
    const matchesStmt = this.db.prepare(`
      DELETE FROM ingredient_matches 
      WHERE created_at < datetime(?)
    `);
    matchesStmt.run(cleanupDate.toISOString());

    // Remove old scraping logs
    const logsStmt = this.db.prepare(`
      DELETE FROM scraping_logs 
      WHERE started_at < datetime(?)
    `);
    logsStmt.run(cleanupDate.toISOString());
  }

  public close(): void {
    this.db.close();
  }

  public backup(backupPath: string): void {
    this.db.backup(backupPath);
  }
} 