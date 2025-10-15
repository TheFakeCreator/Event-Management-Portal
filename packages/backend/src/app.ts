import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { ApiResponse } from '@event-management/shared';
import { env, isDevelopment } from './configs/env.config.js';
import { setupSwagger } from './configs/swagger.js';
import { createApiRouter } from './routes/api.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app: Application = express();
const PORT = env.PORT;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Setup API documentation
setupSwagger(app);

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

// API routes will be added here
app.get('/api', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'Event Management API v1.0.0',
    data: {
      endpoints: [
        '/health - Health check',
        '/api - API information',
        '/api-docs - Interactive API documentation',
        '/api-docs.json - OpenAPI specification',
        '/api/v1 - API version 1 endpoints',
        '/api/versions - Version information',
      ],
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
  console.log(
    `📖 API documentation available at http://localhost:${PORT}/api-docs`
  );
  console.log(`🔍 API information available at http://localhost:${PORT}/api`);
  console.log(`❤️  Health check available at http://localhost:${PORT}/health`);
});

export default app;
