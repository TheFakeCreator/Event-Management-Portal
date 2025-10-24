import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

interface MetricCollector {
  increment(name: string, labels?: Record<string, string>): void;
  decrement(name: string, labels?: Record<string, string>): void;
  gauge(name: string, value: number, labels?: Record<string, string>): void;
  histogram(name: string, value: number, labels?: Record<string, string>): void;
  summary(name: string, value: number, labels?: Record<string, string>): void;
}

interface SystemMetrics {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  eventLoopDelay: number;
  activeHandles: number;
  activeRequests: number;
}

interface RequestMetrics {
  method: string;
  route: string;
  statusCode: number;
  duration: number;
  size: number;
}

interface DatabaseMetrics {
  operation: string;
  collection: string;
  duration: number;
  success: boolean;
}

interface BusinessMetrics {
  eventCreated: number;
  eventRegistrations: number;
  userSignups: number;
  clubMemberships: number;
  failedLogins: number;
  apiErrors: number;
}

class MetricsService {
  private metrics: Map<string, any> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private summaries: Map<string, number[]> = new Map();
  private requestMetrics: RequestMetrics[] = [];
  private systemMetrics: SystemMetrics | null = null;
  private businessMetrics: BusinessMetrics = {
    eventCreated: 0,
    eventRegistrations: 0,
    userSignups: 0,
    clubMemberships: 0,
    failedLogins: 0,
    apiErrors: 0,
  };

  constructor() {
    this.initializeMetrics();
    this.startSystemMetricsCollection();
  }

  private initializeMetrics(): void {
    // Initialize default counters
    this.setCounter('http_requests_total', 0);
    this.setCounter('http_request_duration_seconds', 0);
    this.setCounter('database_operations_total', 0);
    this.setCounter('cache_hits_total', 0);
    this.setCounter('cache_misses_total', 0);
    this.setCounter('authentication_attempts_total', 0);
    this.setCounter('authentication_failures_total', 0);
    this.setCounter('validation_errors_total', 0);
    this.setCounter('application_errors_total', 0);

    // Initialize default gauges
    this.setGauge('nodejs_memory_heap_used_bytes', 0);
    this.setGauge('nodejs_memory_heap_total_bytes', 0);
    this.setGauge('nodejs_memory_external_bytes', 0);
    this.setGauge('nodejs_active_handles', 0);
    this.setGauge('nodejs_active_requests', 0);
    this.setGauge('nodejs_event_loop_lag_seconds', 0);
    this.setGauge('active_connections', 0);
    this.setGauge('registered_users_total', 0);
    this.setGauge('active_events_total', 0);
    this.setGauge('active_clubs_total', 0);
  }

  private startSystemMetricsCollection(): void {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 15000); // Collect every 15 seconds

    // Collect immediately
    this.collectSystemMetrics();
  }

  private collectSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Update memory metrics
    this.setGauge('nodejs_memory_heap_used_bytes', memUsage.heapUsed);
    this.setGauge('nodejs_memory_heap_total_bytes', memUsage.heapTotal);
    this.setGauge('nodejs_memory_external_bytes', memUsage.external);
    this.setGauge('nodejs_memory_rss_bytes', memUsage.rss);

    // Update process metrics
    this.setGauge(
      'nodejs_active_handles',
      (process as any)._getActiveHandles().length
    );
    this.setGauge(
      'nodejs_active_requests',
      (process as any)._getActiveRequests().length
    );

    // Measure event loop lag
    const start = performance.now();
    setImmediate(() => {
      const lag = performance.now() - start;
      this.setGauge('nodejs_event_loop_lag_seconds', lag / 1000);
    });

    // Store system metrics
    this.systemMetrics = {
      uptime: process.uptime(),
      memoryUsage: memUsage,
      cpuUsage,
      eventLoopDelay: 0, // Will be updated by the setImmediate callback
      activeHandles: (process as any)._getActiveHandles().length,
      activeRequests: (process as any)._getActiveRequests().length,
    };
  }

  // Counter operations
  incrementCounter(
    name: string,
    value: number = 1,
    labels?: Record<string, string>
  ): void {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  setCounter(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    const key = this.buildKey(name, labels);
    this.counters.set(key, value);
  }

  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.buildKey(name, labels);
    return this.counters.get(key) || 0;
  }

  // Gauge operations
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);
  }

  incrementGauge(
    name: string,
    value: number = 1,
    labels?: Record<string, string>
  ): void {
    const key = this.buildKey(name, labels);
    const current = this.gauges.get(key) || 0;
    this.gauges.set(key, current + value);
  }

  decrementGauge(
    name: string,
    value: number = 1,
    labels?: Record<string, string>
  ): void {
    const key = this.buildKey(name, labels);
    const current = this.gauges.get(key) || 0;
    this.gauges.set(key, current - value);
  }

  getGauge(name: string, labels?: Record<string, string>): number {
    const key = this.buildKey(name, labels);
    return this.gauges.get(key) || 0;
  }

  // Histogram operations
  recordHistogram(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    const key = this.buildKey(name, labels);
    const current = this.histograms.get(key) || [];
    current.push(value);

    // Keep only last 1000 values to prevent memory leaks
    if (current.length > 1000) {
      current.shift();
    }

    this.histograms.set(key, current);
  }

  // HTTP Request metrics
  recordRequest(metrics: RequestMetrics): void {
    const labels = {
      method: metrics.method,
      route: metrics.route,
      status_code: metrics.statusCode.toString(),
    };

    // Increment request counter
    this.incrementCounter('http_requests_total', 1, labels);

    // Record request duration
    this.recordHistogram(
      'http_request_duration_seconds',
      metrics.duration / 1000,
      labels
    );

    // Record request size
    if (metrics.size > 0) {
      this.recordHistogram('http_request_size_bytes', metrics.size, labels);
    }

    // Keep recent request metrics for analysis
    this.requestMetrics.push(metrics);
    if (this.requestMetrics.length > 1000) {
      this.requestMetrics.shift();
    }

    // Track errors
    if (metrics.statusCode >= 400) {
      this.incrementCounter('http_errors_total', 1, {
        ...labels,
        error_type: this.getErrorType(metrics.statusCode),
      });
    }
  }

  // Database metrics
  recordDatabaseOperation(metrics: DatabaseMetrics): void {
    const labels = {
      operation: metrics.operation,
      collection: metrics.collection,
      status: metrics.success ? 'success' : 'error',
    };

    this.incrementCounter('database_operations_total', 1, labels);
    this.recordHistogram(
      'database_operation_duration_seconds',
      metrics.duration / 1000,
      labels
    );

    if (!metrics.success) {
      this.incrementCounter('database_errors_total', 1, labels);
    }
  }

  // Authentication metrics
  recordAuthenticationAttempt(
    success: boolean,
    method: string = 'password'
  ): void {
    const labels = { method };

    this.incrementCounter('authentication_attempts_total', 1, labels);

    if (!success) {
      this.incrementCounter('authentication_failures_total', 1, labels);
      this.businessMetrics.failedLogins++;
    }
  }

  // Business metrics
  recordBusinessEvent(event: keyof BusinessMetrics, value: number = 1): void {
    this.businessMetrics[event] += value;

    // Also record as counters for Prometheus
    this.incrementCounter(`business_${event}_total`, value);
  }

  // Cache metrics
  recordCacheOperation(
    operation: 'hit' | 'miss' | 'set' | 'delete',
    key?: string
  ): void {
    const labels = key ? { cache_key: key } : undefined;
    this.incrementCounter(`cache_${operation}s_total`, 1, labels);
  }

  // Error tracking
  recordError(error: Error, context?: Record<string, string>): void {
    const labels = {
      error_name: error.name,
      ...context,
    };

    this.incrementCounter('application_errors_total', 1, labels);
    this.businessMetrics.apiErrors++;
  }

  // Validation error tracking
  recordValidationError(field: string, rule: string): void {
    const labels = { field, rule };
    this.incrementCounter('validation_errors_total', 1, labels);
  }

  // Get metrics for export (Prometheus format)
  getMetricsForExport(): string {
    const lines: string[] = [];

    // Export counters
    for (const [key, value] of this.counters.entries()) {
      const { name, labels } = this.parseKey(key);
      const labelsStr = this.formatLabels(labels);
      lines.push(`${name}${labelsStr} ${value}`);
    }

    // Export gauges
    for (const [key, value] of this.gauges.entries()) {
      const { name, labels } = this.parseKey(key);
      const labelsStr = this.formatLabels(labels);
      lines.push(`${name}${labelsStr} ${value}`);
    }

    // Export histograms (simplified - just count and sum)
    for (const [key, values] of this.histograms.entries()) {
      const { name, labels } = this.parseKey(key);
      const labelsStr = this.formatLabels(labels);
      const count = values.length;
      const sum = values.reduce((a, b) => a + b, 0);

      lines.push(`${name}_count${labelsStr} ${count}`);
      lines.push(`${name}_sum${labelsStr} ${sum}`);

      if (count > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        const p50 = sorted[Math.floor(count * 0.5)];
        const p95 = sorted[Math.floor(count * 0.95)];
        const p99 = sorted[Math.floor(count * 0.99)];

        lines.push(
          `${name}_bucket{le="0.5",${
            labels
              ? Object.entries(labels)
                  .map(([k, v]) => `${k}="${v}"`)
                  .join(',') + ','
              : ''
          }quantile="0.5"} ${p50}`
        );
        lines.push(
          `${name}_bucket{le="0.95",${
            labels
              ? Object.entries(labels)
                  .map(([k, v]) => `${k}="${v}"`)
                  .join(',') + ','
              : ''
          }quantile="0.95"} ${p95}`
        );
        lines.push(
          `${name}_bucket{le="0.99",${
            labels
              ? Object.entries(labels)
                  .map(([k, v]) => `${k}="${v}"`)
                  .join(',') + ','
              : ''
          }quantile="0.99"} ${p99}`
        );
      }
    }

    return lines.join('\n');
  }

  // Get summary for health checks
  getSummary(): any {
    return {
      system: this.systemMetrics,
      business: this.businessMetrics,
      requests: {
        total: this.getCounter('http_requests_total'),
        errors: this.getCounter('http_errors_total'),
        averageResponseTime: this.calculateAverageResponseTime(),
      },
      database: {
        operations: this.getCounter('database_operations_total'),
        errors: this.getCounter('database_errors_total'),
      },
      authentication: {
        attempts: this.getCounter('authentication_attempts_total'),
        failures: this.getCounter('authentication_failures_total'),
      },
    };
  }

  // Middleware for Express
  requestMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const start = performance.now();
      let requestSize = 0;

      if (req.headers['content-length']) {
        requestSize = parseInt(req.headers['content-length']);
      }

      res.on('finish', () => {
        const duration = performance.now() - start;
        const route = req.route?.path || req.path;

        this.recordRequest({
          method: req.method,
          route,
          statusCode: res.statusCode,
          duration,
          size: requestSize,
        });
      });

      next();
    };
  }

  private buildKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return `${name}|${labelStr}`;
  }

  private parseKey(key: string): {
    name: string;
    labels?: Record<string, string>;
  } {
    const parts = key.split('|');
    const name = parts[0];

    if (parts.length === 1) {
      return { name };
    }

    const labels: Record<string, string> = {};
    parts[1].split(',').forEach((pair) => {
      const [k, v] = pair.split(':');
      labels[k] = v;
    });

    return { name, labels };
  }

  private formatLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `{${labelStr}}`;
  }

  private getErrorType(statusCode: number): string {
    if (statusCode >= 400 && statusCode < 500) {
      return 'client_error';
    } else if (statusCode >= 500) {
      return 'server_error';
    }
    return 'unknown';
  }

  private calculateAverageResponseTime(): number {
    if (this.requestMetrics.length === 0) {
      return 0;
    }
    const total = this.requestMetrics.reduce(
      (sum, req) => sum + req.duration,
      0
    );
    return total / this.requestMetrics.length;
  }
}

// Create singleton instance
export const metricsService = new MetricsService();

// Export types
export type {
  MetricCollector,
  SystemMetrics,
  RequestMetrics,
  DatabaseMetrics,
  BusinessMetrics,
};

// Export convenience functions
export const metrics = {
  increment: (name: string, value?: number, labels?: Record<string, string>) =>
    metricsService.incrementCounter(name, value, labels),
  gauge: (name: string, value: number, labels?: Record<string, string>) =>
    metricsService.setGauge(name, value, labels),
  histogram: (name: string, value: number, labels?: Record<string, string>) =>
    metricsService.recordHistogram(name, value, labels),
  recordRequest: (metrics: RequestMetrics) =>
    metricsService.recordRequest(metrics),
  recordDatabaseOp: (metrics: DatabaseMetrics) =>
    metricsService.recordDatabaseOperation(metrics),
  recordBusinessEvent: (event: keyof BusinessMetrics, value?: number) =>
    metricsService.recordBusinessEvent(event, value),
  recordError: (error: Error, context?: Record<string, string>) =>
    metricsService.recordError(error, context),
};
