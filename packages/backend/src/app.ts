import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { ApiResponse } from '@event-management/shared'; // Import ApiResponse type
import { env, isDevelopment } from './configs/env.config.js'; // Import environment configs
import { setupSwagger } from './configs/swagger.js';
import { createApiRouter } from './routes/api.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { connectDatabase } from './configs/database.config.js';

const app: Application = express();
const PORT = env.PORT;

// Security middleware
app.use(helmet());
// CORS: support multiple origins (comma-separated in env) and dynamic dev origins
const allowedOrigins = (env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl)
      if (!origin) return callback(null, true);

      // Allow explicit configured origins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // During development, allow localhost on any port (useful when frontend runs on different port)
      if (isDevelopment && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      // Otherwise reject
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Setup API documentation in development only
if (isDevelopment) {
  setupSwagger(app);
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'Backend API is running successfully!',
    data: {
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: '1.0.0',
    },
  };
  res.json(response);
});

// Mount API routes with versioning
app.use('/api', createApiRouter());

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server after establishing database connection
(async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
      console.log(
        `📖 API documentation available at http://localhost:${PORT}/api-docs`
      );
      console.log(
        `🔍 API information available at http://localhost:${PORT}/api`
      );
      console.log(
        `❤️  Health check available at http://localhost:${PORT}/health`
      );
    });
  } catch (error) {
    console.error('Failed to start server due to DB connection error:', error);
    process.exit(1);
  }
})();

export default app;
