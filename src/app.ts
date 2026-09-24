import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';


const app: Application = express();

app.set('trust proxy', 1);

// Security Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS (env-driven allowlist with permissive fallback for Vercel & client apps)
const normalizeOrigin = (value: string) => value.trim().replace(/\/+$/, '').toLowerCase();

const allowedOrigins = env.FRONTEND_URL
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (no Origin header)
    if (!origin) {
      return callback(null, true);
    }

    const requestOrigin = normalizeOrigin(origin);

    // Allow all origins when configured, or any vercel.app / localhost domain
    if (
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(requestOrigin) ||
      requestOrigin.endsWith('.vercel.app') ||
      requestOrigin.includes('localhost') ||
      requestOrigin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }

    // Permissive fallback: mirror origin so credentials and preflights succeed
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Generous rate limit for API and polling
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api', limiter);

// Built-in Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  import('mongoose').then((mongoose) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.json({
      success: true,
      status: 'healthy',
      database: isDbConnected ? 'connected' : 'disconnected',
    });
  });
});

import authRoutes from './routes/auth.routes';
import farmerRoutes from './routes/farmer.routes';
import productRoutes from './routes/product.routes';
import supplierRoutes from './routes/supplier.routes';
import inventoryRoutes from './routes/inventory.routes';
import purchaseRoutes from './routes/purchase.routes';
import saleRoutes from './routes/sale.routes';
import paymentRoutes from './routes/payment.routes';
import creditRoutes from './routes/credit.routes';
import dashboardRoutes from './routes/dashboard.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import subscriptionRoutes from './routes/subscription.routes';
import backupRoutes from './routes/backup.routes';

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/farmers', farmerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/purchases', purchaseRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/credits', creditRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/backup', backupRoutes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
