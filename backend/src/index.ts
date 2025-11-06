import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/index.js';
import uploadRouter from './routes/upload.js';
import downloadRouter from './routes/download.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (for Railway and other reverse proxies)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Configure CORS to accept Vercel preview domains
const corsOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: (origin, callback) => {
    // Allow localhost, configured FRONTEND_URL, and any Vercel preview domains
    if (!origin || origin === corsOrigin || origin.includes('vercel.app') || origin === 'http://localhost:3000') {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});

app.use(limiter);

// Body parser
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Routes
app.use('/api/upload', uploadRouter);
app.use('/api/download', downloadRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    const db = await initializeDatabase();
    console.log('✓ Database connected');

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
