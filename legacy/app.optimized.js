// Load environment variables first
import dotenv from "dotenv";
dotenv.config();

// Validate environment variables for security
import { validateEnvironment } from "./utils/envValidator.js";
validateEnvironment();

// Performance monitoring setup (early initialization)
import {
    performanceMiddleware,
    createHealthChecks,
    PerformanceAlerter,
    MemoryMonitor
} from "./middlewares/performanceMiddleware.js";
import mongoose from 'mongoose';

// DB Import with optimization setup (legacy)
// Note: auto-connect was migrated to the backend TS `database.config.ts` helper.
// Legacy usage of `./configs/mongoose-connect.js` has been commented out.
// import db from "./configs/mongoose-connect.js";
import { QueryOptimizer } from "./utils/queryOptimizer.js";

// Package Imports
import cookieParser from "cookie-parser";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import expressSession from "express-session";
import flash from "connect-flash";
import ejsMate from "ejs-mate";
import "./configs/passport.js";
import cors from "cors";
import passport from "passport";
import "./jobs/eventReminder.js";

// Performance and Optimization Imports
import { createOptimizationMiddleware } from "./middlewares/compressionMiddleware.js";
import { cache } from "./middlewares/cacheMiddleware.js";
import redis from "./middlewares/cacheMiddleware.js";

// Middleware Imports
import errorHandler from "./middlewares/errorHandler.js";

// Router Imports
import indexRouter from "./routes/index.routes.js";
import adminRouter from "./routes/admin.routes.js";
import eventRouter from "./routes/event.routes.js";
import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";
import clubRouter from "./routes/club.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import recruitmentRouter from "./routes/recruitment.routes.js";
import announcementRouter from "./routes/announcement.routes.js";

// App constants
const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database optimizations
(async () => {
    try {
        await QueryOptimizer.createOptimalIndexes();
        console.log('✅ Database optimizations initialized');
    } catch (error) {
        console.error('❌ Database optimization error:', error);
    }
})();

// Performance monitoring setup
const performanceAlerter = new PerformanceAlerter({
    responseTime: 5000, // 5 seconds
    errorRate: 10, // 10%
    memoryUsage: 80 // 80%
});

// Start performance monitoring in production
if (process.env.NODE_ENV === 'production') {
    performanceAlerter.startMonitoring();
    MemoryMonitor.monitorMemoryLeaks(150); // 150MB threshold
}

// Trust proxy for correct IP addresses behind reverse proxy
app.set('trust proxy', 1);

// Early middleware for performance monitoring
app.use(performanceMiddleware({
    logSlowRequests: true,
    slowThreshold: 1000 // 1 second
}));

// Security and CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// Compression and optimization middleware
const optimizationMiddlewares = createOptimizationMiddleware({
    enableCompression: true,
    enableMinification: process.env.NODE_ENV === 'production',
    enableAssetCaching: true,
    enableResourceHints: true
});

optimizationMiddlewares.forEach(middleware => {
    app.use(middleware);
});

// Template engine setup
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({
    extended: true,
    limit: '10mb',
    parameterLimit: 1000
}));

// Static file serving with caching
app.use(express.static(path.join(__dirname, "public"), {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Set specific cache headers for different file types
        if (path.endsWith('.css') || path.endsWith('.js')) {
            res.set('Cache-Control', 'public, max-age=31536000'); // 1 year
        } else if (path.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
            res.set('Cache-Control', 'public, max-age=2592000'); // 30 days
        }
    }
}));

app.use(cookieParser());

// Session configuration with Redis store for production
const sessionConfig = {
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        httpOnly: true,
        sameSite: 'lax'
    }
};

// Use Redis for session store in production
if (process.env.NODE_ENV === 'production' && redis) {
    try {
        const RedisStore = (await import('connect-redis')).default;
        sessionConfig.store = new RedisStore({ client: redis });
        console.log('✅ Redis session store configured');
    } catch (error) {
        console.warn('⚠️ Redis session store not available, using memory store');
    }
}

app.use(expressSession(sessionConfig));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// API caching for specific routes
const apiCache = cache({
    ttl: 300, // 5 minutes
    prefix: 'api'
});

// Routes with caching where appropriate
app.use("/", indexRouter);
app.use("/admin", adminRouter);
app.use("/event", eventRouter);
app.use("/user", userRouter);
app.use("/auth", authRouter);
app.use("/club", clubRouter);
app.use("/recruitment", recruitmentRouter);
app.use("/announcements", announcementRouter);
app.use("/api", uploadRoutes);

// API routes with caching
app.use("/api/events", apiCache, eventRouter);
app.use("/announcements", announcementRouter);

// Health check and metrics endpoints
createHealthChecks(app);

// API documentation endpoint (development only)
if (process.env.NODE_ENV !== 'production') {
    app.get('/api/docs', (req, res) => {
        res.json({
            message: 'API Documentation',
            endpoints: {
                'GET /health': 'Basic health check',
                'GET /metrics': 'Performance metrics',
                'GET /metrics/slow': 'Slow endpoints report',
                'GET /api/events': 'Events API (cached)',
                'GET /api/clubs': 'Clubs API (cached)',
            },
            performance: {
                caching: 'Redis-based caching enabled',
                compression: 'Gzip/Brotli compression enabled',
                monitoring: 'Request performance monitoring active',
                optimization: 'Database query optimization active'
            }
        });
    });
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');

    try {
    // Close database connection
    await mongoose.connection.close();
        console.log('✅ Database connection closed');

        // Close Redis connection
        if (redis) {
            await redis.quit();
            console.log('✅ Redis connection closed');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');

    try {
    await mongoose.connection.close();
        if (redis) await redis.quit();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

// Memory leak detection in development
if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
        const memUsage = process.memoryUsage();
        console.log('💾 Memory Usage:', {
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`
        });
    }, 300000); // Every 5 minutes
}

// Centralized error handler (must be after all routes)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).render('404', {
        title: 'Page Not Found',
        user: req.user,
        isAuthenticated: req.isAuthenticated
    });
});

// Only start server if not in test environment
if (process.env.NODE_ENV !== "test") {
    const server = app.listen(port, () => {
        console.log(`🚀 Server running at http://localhost:${port}`);
        console.log(`📊 Performance monitoring: ${process.env.NODE_ENV === 'production' ? 'Active' : 'Development mode'}`);
        console.log(`🗄️  Database optimization: Active`);
        console.log(`📦 Caching: ${redis ? 'Redis' : 'Memory'}`);
        console.log(`📈 Monitoring endpoints: /health, /metrics`);
    });

    // Handle server shutdown
    server.on('close', () => {
        console.log('🛑 Server closed');
    });
}

export default app;