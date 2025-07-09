import cron from 'node-cron';
import { SupermarketScraper } from '../scrapers/SupermarketScraper.js';
import { IngredientMatcher } from './IngredientMatcher.js';
import { DatabaseService } from '../database/connection.js';
import { CronJobConfig } from '../types/index.js';

export class CronService {
  private scraper: SupermarketScraper;
  private matcher: IngredientMatcher;
  private db: DatabaseService;
  private config: CronJobConfig;
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  constructor(config?: Partial<CronJobConfig>) {
    this.scraper = new SupermarketScraper();
    this.matcher = new IngredientMatcher();
    this.db = DatabaseService.getInstance();
    
    this.config = {
      scraping_schedule: config?.scraping_schedule || '0 2 */2 * *', // Every 2 days at 2 AM
      cleanup_schedule: config?.cleanup_schedule || '0 3 0 * *', // Weekly at 3 AM on Sunday
      backup_schedule: config?.backup_schedule || '0 4 * * *', // Daily at 4 AM
      ...config
    };
  }

  public start(): void {
    this.setupScrapingJob();
    this.setupCleanupJob();
    this.setupBackupJob();
    this.setupIndexRefreshJob();
    
    console.log('Cron service started with jobs:', Array.from(this.jobs.keys()));
  }

  public stop(): void {
    for (const [name, task] of this.jobs) {
      task.stop();
      console.log(`Stopped cron job: ${name}`);
    }
    this.jobs.clear();
  }

  private setupScrapingJob(): void {
    const task = cron.schedule(this.config.scraping_schedule, async () => {
      console.log('Starting scheduled product scraping...');
      try {
        await this.scraper.initialize();
        const results = await this.scraper.scrapeAllSupermarkets();
        
        const summary = {
          total_products: results.reduce((sum, r) => sum + r.products_scraped, 0),
          successful_supermarkets: results.filter(r => r.success).length,
          failed_supermarkets: results.filter(r => !r.success).length,
          errors: results.flatMap(r => r.errors)
        };

        console.log('Scheduled scraping completed:', summary);
        
        // Refresh search indexes after scraping
        await this.matcher.refreshAllIndexes();
        
      } catch (error) {
        console.error('Scheduled scraping failed:', error);
      } finally {
        await this.scraper.close();
      }
    }, {
      scheduled: false,
      timezone: 'Europe/London'
    });

    this.jobs.set('scraping', task);
    console.log(`Scraping job scheduled: ${this.config.scraping_schedule}`);
  }

  private setupCleanupJob(): void {
    const task = cron.schedule(this.config.cleanup_schedule, async () => {
      console.log('Starting scheduled database cleanup...');
      try {
        // Clean up old data (older than 30 days)
        this.db.cleanupOldData(30);
        
        // Remove duplicate products
        await this.removeDuplicateProducts();
        
        // Update price history for existing products
        await this.updatePriceHistory();
        
        console.log('Database cleanup completed');
      } catch (error) {
        console.error('Database cleanup failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Europe/London'
    });

    this.jobs.set('cleanup', task);
    console.log(`Cleanup job scheduled: ${this.config.cleanup_schedule}`);
  }

  private setupBackupJob(): void {
    const task = cron.schedule(this.config.backup_schedule, async () => {
      console.log('Starting scheduled database backup...');
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `./backups/products_${timestamp}.db`;
        
        // Ensure backup directory exists
        const { mkdirSync } = await import('fs');
        mkdirSync('./backups', { recursive: true });
        
        this.db.backup(backupPath);
        console.log(`Database backup completed: ${backupPath}`);
        
        // Clean up old backups (keep last 7 days)
        await this.cleanupOldBackups();
        
      } catch (error) {
        console.error('Database backup failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Europe/London'
    });

    this.jobs.set('backup', task);
    console.log(`Backup job scheduled: ${this.config.backup_schedule}`);
  }

  private setupIndexRefreshJob(): void {
    // Refresh search indexes every 6 hours
    const task = cron.schedule('0 */6 * * *', async () => {
      console.log('Refreshing search indexes...');
      try {
        await this.matcher.refreshAllIndexes();
        console.log('Search indexes refreshed');
      } catch (error) {
        console.error('Search index refresh failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Europe/London'
    });

    this.jobs.set('index-refresh', task);
    console.log('Index refresh job scheduled: every 6 hours');
  }

  private async removeDuplicateProducts(): Promise<void> {
    const db = this.db.getDatabase();
    
    // Remove duplicates based on product_url and supermarket
    const query = `
      DELETE FROM products 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM products 
        GROUP BY product_url, supermarket
      )
    `;
    
    const result = db.prepare(query).run();
    console.log(`Removed ${result.changes} duplicate products`);
  }

  private async updatePriceHistory(): Promise<void> {
    const db = this.db.getDatabase();
    
    // Find products with price changes
    const query = `
      SELECT p.id, p.price, p.availability,
             ph.price as last_price, ph.availability as last_availability
      FROM products p
      LEFT JOIN (
        SELECT product_id, price, availability,
               ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY recorded_at DESC) as rn
        FROM price_history
      ) ph ON p.id = ph.product_id AND ph.rn = 1
      WHERE ph.product_id IS NULL 
         OR p.price != ph.price 
         OR p.availability != ph.availability
    `;
    
    const changedProducts = db.prepare(query).all();
    
    for (const product of changedProducts) {
      this.db.addPriceHistory(product.id, product.price, product.availability);
    }
    
    console.log(`Updated price history for ${changedProducts.length} products`);
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const { readdir, stat, unlink } = await import('fs/promises');
      const { join } = await import('path');
      
      const backupDir = './backups';
      const files = await readdir(backupDir);
      const dbFiles = files.filter(f => f.endsWith('.db'));
      
      const fileStats = await Promise.all(
        dbFiles.map(async (file) => {
          const filePath = join(backupDir, file);
          const stats = await stat(filePath);
          return { file, path: filePath, mtime: stats.mtime };
        })
      );
      
      // Sort by modification time (newest first)
      fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      
      // Keep only the last 7 backups
      const filesToDelete = fileStats.slice(7);
      
      for (const fileInfo of filesToDelete) {
        await unlink(fileInfo.path);
        console.log(`Deleted old backup: ${fileInfo.file}`);
      }
      
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  // Manual trigger methods for testing/admin use
  public async triggerScraping(): Promise<void> {
    console.log('Manually triggering scraping...');
    try {
      await this.scraper.initialize();
      const results = await this.scraper.scrapeAllSupermarkets();
      console.log('Manual scraping completed:', results);
      await this.matcher.refreshAllIndexes();
    } finally {
      await this.scraper.close();
    }
  }

  public async triggerCleanup(): Promise<void> {
    console.log('Manually triggering cleanup...');
    this.db.cleanupOldData(30);
    await this.removeDuplicateProducts();
    await this.updatePriceHistory();
    console.log('Manual cleanup completed');
  }

  public async triggerBackup(): Promise<void> {
    console.log('Manually triggering backup...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `./backups/products_manual_${timestamp}.db`;
    
    const { mkdirSync } = await import('fs');
    mkdirSync('./backups', { recursive: true });
    
    this.db.backup(backupPath);
    console.log(`Manual backup completed: ${backupPath}`);
  }

  public getJobStatus(): Record<string, { running: boolean, nextRun?: Date }> {
    const status: Record<string, { running: boolean, nextRun?: Date }> = {};
    
    for (const [name, task] of this.jobs) {
      status[name] = {
        running: task.running,
        nextRun: task.nextDates(1)[0]?.toJSDate()
      };
    }
    
    return status;
  }

  public startJob(jobName: string): boolean {
    const task = this.jobs.get(jobName);
    if (task) {
      task.start();
      console.log(`Started job: ${jobName}`);
      return true;
    }
    return false;
  }

  public stopJob(jobName: string): boolean {
    const task = this.jobs.get(jobName);
    if (task) {
      task.stop();
      console.log(`Stopped job: ${jobName}`);
      return true;
    }
    return false;
  }
} 