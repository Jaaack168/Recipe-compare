import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import priceComparisonRoutes from './routes/priceComparison.js';

// Import services
import { CronService } from './services/CronService.js';
import { DatabaseService } from './database/connection.js';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api', priceComparisonRoutes);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Initialize services
let cronService: CronService;

async function initializeServices() {
  try {
    // Initialize database
    console.log('Initializing database...');
    const db = DatabaseService.getInstance();
    console.log('Database initialized successfully');

    // Initialize cron service
    console.log('Initializing cron service...');
    cronService = new CronService({
      scraping_schedule: process.env.SCRAPING_SCHEDULE || '0 2 */2 * *', // Every 2 days at 2 AM
      cleanup_schedule: process.env.CLEANUP_SCHEDULE || '0 3 0 * *',     // Weekly on Sunday at 3 AM
      backup_schedule: process.env.BACKUP_SCHEDULE || '0 4 * * *'        // Daily at 4 AM
    });
    
    // Start cron jobs only in production or if explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
      cronService.start();
      console.log('Cron service started');
    } else {
      console.log('Cron service initialized but not started (development mode)');
    }

    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  if (cronService) {
    cronService.stop();
  }
  
  // Close database connections
  try {
    const db = DatabaseService.getInstance();
    db.close();
  } catch (error) {
    console.error('Error closing database:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  if (cronService) {
    cronService.stop();
  }
  
  try {
    const db = DatabaseService.getInstance();
    db.close();
  } catch (error) {
    console.error('Error closing database:', error);
  }
  
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🛒 API base: http://localhost:${PORT}/api`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Log available endpoints
      console.log('\n📋 Available endpoints:');
      console.log('  POST /api/compare-prices - Compare ingredient prices across stores');
      console.log('  GET  /api/products/search?q=<query> - Search products');
      console.log('  GET  /api/products/category/<category> - Get products by category');
      console.log('  GET  /api/price-changes?days=<days> - Get recent price changes');
      console.log('  GET  /api/stats - Get store statistics');
      console.log('  POST /api/test-match - Test ingredient matching (dev)');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app; 