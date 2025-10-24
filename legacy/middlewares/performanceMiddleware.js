import { performance } from 'perf_hooks';
import os from 'os';
import process from 'process';

/**
 * Performance monitoring and metrics collection
 */
export class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.startTime = Date.now();
        this.requestCount = 0;
        this.errorCount = 0;
    }

    /**
     * Record request performance metrics
     */
    recordRequest(req, res, duration, error = null) {
        this.requestCount++;
        if (error) this.errorCount++;

        const route = req.route?.path || req.path;
        const method = req.method;
        const key = `${method} ${route}`;

        if (!this.metrics.has(key)) {
            this.metrics.set(key, {
                count: 0,
                totalDuration: 0,
                minDuration: Infinity,
                maxDuration: 0,
                errors: 0,
                statusCodes: new Map()
            });
        }

        const metric = this.metrics.get(key);
        metric.count++;
        metric.totalDuration += duration;
        metric.minDuration = Math.min(metric.minDuration, duration);
        metric.maxDuration = Math.max(metric.maxDuration, duration);

        if (error) metric.errors++;

        // Track status codes
        const statusCode = res.statusCode;
        const currentCount = metric.statusCodes.get(statusCode) || 0;
        metric.statusCodes.set(statusCode, currentCount + 1);
    }

    /**
     * Get performance summary
     */
    getMetrics() {
        const uptime = Date.now() - this.startTime;
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        const routeMetrics = {};
        for (const [route, data] of this.metrics.entries()) {
            routeMetrics[route] = {
                ...data,
                avgDuration: data.totalDuration / data.count,
                errorRate: (data.errors / data.count) * 100,
                statusCodes: Object.fromEntries(data.statusCodes)
            };
        }

        return {
            uptime,
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            errorRate: (this.errorCount / this.requestCount) * 100,
            memory: {
                rss: Math.round(memoryUsage.rss / 1024 / 1024),
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                external: Math.round(memoryUsage.external / 1024 / 1024)
            },
            cpu: {
                user: Math.round(cpuUsage.user / 1000),
                system: Math.round(cpuUsage.system / 1000)
            },
            system: {
                loadAverage: os.loadavg(),
                freeMemory: Math.round(os.freemem() / 1024 / 1024),
                totalMemory: Math.round(os.totalmem() / 1024 / 1024),
                cpus: os.cpus().length
            },
            routes: routeMetrics
        };
    }

    /**
     * Get slow endpoints (above threshold)
     */
    getSlowEndpoints(threshold = 1000) {
        const slow = [];
        for (const [route, data] of this.metrics.entries()) {
            const avgDuration = data.totalDuration / data.count;
            if (avgDuration > threshold) {
                slow.push({
                    route,
                    avgDuration: Math.round(avgDuration),
                    maxDuration: data.maxDuration,
                    count: data.count
                });
            }
        }
        return slow.sort((a, b) => b.avgDuration - a.avgDuration);
    }

    /**
     * Reset metrics
     */
    reset() {
        this.metrics.clear();
        this.requestCount = 0;
        this.errorCount = 0;
        this.startTime = Date.now();
    }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Express middleware for performance monitoring
 */
export const performanceMiddleware = (options = {}) => {
    const { logSlowRequests = true, slowThreshold = 1000 } = options;

    return (req, res, next) => {
        const startTime = performance.now();

        // Store start time in request
        req.performanceStart = startTime;

        // Override res.end to capture metrics
        const originalEnd = res.end;
        res.end = function (...args) {
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);

            // Record metrics
            performanceMonitor.recordRequest(req, res, duration);

            // Log slow requests
            if (logSlowRequests && duration > slowThreshold) {
                console.warn(`⚠️ Slow request detected: ${req.method} ${req.originalUrl} - ${duration}ms`);
            }

            // Add performance headers
            res.set({
                'X-Response-Time': `${duration}ms`,
                'X-Request-ID': req.id || 'unknown'
            });

            // Call original end
            return originalEnd.apply(this, args);
        };

        next();
    };
};

/**
 * Database query performance monitoring
 */
export class DatabasePerformanceMonitor {
    constructor() {
        this.queryMetrics = new Map();
    }

    /**
     * Wrap mongoose queries to monitor performance
     */
    static setupMongooseMonitoring() {
        const mongoose = require('mongoose');

        // Monitor query execution
        mongoose.connection.on('connected', () => {
            const db = mongoose.connection.db;

            if (db && db.s && db.s.options) {
                // Enable profiling for slow operations (> 100ms)
                db.admin().command({ profile: 2, slowms: 100 });
            }
        });

        // Log slow queries
        mongoose.set('debug', (collectionName, method, query, doc, options) => {
            const start = performance.now();

            // This would need to be implemented with a custom plugin
            console.log(`🔍 MongoDB Query: ${collectionName}.${method}`, {
                query,
                options
            });
        });
    }

    /**
     * Monitor specific query performance
     */
    async monitorQuery(queryName, queryFn) {
        const startTime = performance.now();

        try {
            const result = await queryFn();
            const duration = performance.now() - startTime;

            this.recordQuery(queryName, duration, true);

            if (duration > 500) {
                console.warn(`⚠️ Slow database query: ${queryName} - ${Math.round(duration)}ms`);
            }

            return result;
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordQuery(queryName, duration, false);
            throw error;
        }
    }

    recordQuery(queryName, duration, success) {
        if (!this.queryMetrics.has(queryName)) {
            this.queryMetrics.set(queryName, {
                count: 0,
                totalDuration: 0,
                avgDuration: 0,
                minDuration: Infinity,
                maxDuration: 0,
                errors: 0
            });
        }

        const metric = this.queryMetrics.get(queryName);
        metric.count++;
        metric.totalDuration += duration;
        metric.avgDuration = metric.totalDuration / metric.count;
        metric.minDuration = Math.min(metric.minDuration, duration);
        metric.maxDuration = Math.max(metric.maxDuration, duration);

        if (!success) metric.errors++;
    }

    getQueryMetrics() {
        const metrics = {};
        for (const [queryName, data] of this.queryMetrics.entries()) {
            metrics[queryName] = {
                ...data,
                avgDuration: Math.round(data.avgDuration),
                minDuration: Math.round(data.minDuration),
                maxDuration: Math.round(data.maxDuration),
                errorRate: (data.errors / data.count) * 100
            };
        }
        return metrics;
    }
}

export const dbPerformanceMonitor = new DatabasePerformanceMonitor();

/**
 * Memory usage monitoring
 */
export class MemoryMonitor {
    static getMemoryUsage() {
        const usage = process.memoryUsage();

        return {
            rss: {
                bytes: usage.rss,
                mb: Math.round(usage.rss / 1024 / 1024),
                percentage: (usage.rss / os.totalmem()) * 100
            },
            heapTotal: {
                bytes: usage.heapTotal,
                mb: Math.round(usage.heapTotal / 1024 / 1024)
            },
            heapUsed: {
                bytes: usage.heapUsed,
                mb: Math.round(usage.heapUsed / 1024 / 1024),
                percentage: (usage.heapUsed / usage.heapTotal) * 100
            },
            external: {
                bytes: usage.external,
                mb: Math.round(usage.external / 1024 / 1024)
            },
            arrayBuffers: {
                bytes: usage.arrayBuffers,
                mb: Math.round(usage.arrayBuffers / 1024 / 1024)
            }
        };
    }

    static monitorMemoryLeaks(threshold = 100) {
        const initialUsage = this.getMemoryUsage();

        return setInterval(() => {
            const currentUsage = this.getMemoryUsage();
            const heapIncrease = currentUsage.heapUsed.mb - initialUsage.heapUsed.mb;

            if (heapIncrease > threshold) {
                console.warn(`⚠️ Potential memory leak detected: Heap increased by ${heapIncrease}MB`);

                // Log top memory consumers
                if (global.gc) {
                    global.gc();
                    console.log('🧹 Garbage collection triggered');
                }
            }
        }, 60000); // Check every minute
    }
}

/**
 * Health check endpoints
 */
export const createHealthChecks = (app) => {
    // Basic health check
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });

    // Detailed performance metrics
    app.get('/metrics', (req, res) => {
        const metrics = performanceMonitor.getMetrics();
        const memoryUsage = MemoryMonitor.getMemoryUsage();
        const queryMetrics = dbPerformanceMonitor.getQueryMetrics();

        res.json({
            performance: metrics,
            memory: memoryUsage,
            database: queryMetrics,
            timestamp: new Date().toISOString()
        });
    });

    // Slow endpoints report
    app.get('/metrics/slow', (req, res) => {
        const threshold = parseInt(req.query.threshold) || 1000;
        const slowEndpoints = performanceMonitor.getSlowEndpoints(threshold);

        res.json({
            threshold,
            slowEndpoints,
            timestamp: new Date().toISOString()
        });
    });
};

/**
 * Performance alerts
 */
export class PerformanceAlerter {
    constructor(options = {}) {
        this.thresholds = {
            responseTime: options.responseTime || 5000,
            errorRate: options.errorRate || 5, // percentage
            memoryUsage: options.memoryUsage || 80, // percentage
            ...options
        };
    }

    checkPerformance() {
        const metrics = performanceMonitor.getMetrics();
        const memoryUsage = MemoryMonitor.getMemoryUsage();
        const alerts = [];

        // Check error rate
        if (metrics.errorRate > this.thresholds.errorRate) {
            alerts.push({
                type: 'error_rate',
                message: `High error rate: ${metrics.errorRate.toFixed(2)}%`,
                threshold: this.thresholds.errorRate,
                current: metrics.errorRate
            });
        }

        // Check memory usage
        if (memoryUsage.rss.percentage > this.thresholds.memoryUsage) {
            alerts.push({
                type: 'memory_usage',
                message: `High memory usage: ${memoryUsage.rss.percentage.toFixed(2)}%`,
                threshold: this.thresholds.memoryUsage,
                current: memoryUsage.rss.percentage
            });
        }

        // Check slow endpoints
        const slowEndpoints = performanceMonitor.getSlowEndpoints(this.thresholds.responseTime);
        if (slowEndpoints.length > 0) {
            alerts.push({
                type: 'slow_endpoints',
                message: `${slowEndpoints.length} endpoints exceeding response time threshold`,
                endpoints: slowEndpoints.slice(0, 5) // Top 5
            });
        }

        return alerts;
    }

    startMonitoring(interval = 300000) { // 5 minutes
        setInterval(() => {
            const alerts = this.checkPerformance();

            if (alerts.length > 0) {
                console.warn('⚠️ Performance alerts:', alerts);

                // Here you could send alerts to external services
                // like Slack, Discord, email, etc.
            }
        }, interval);
    }
}

export default performanceMonitor;