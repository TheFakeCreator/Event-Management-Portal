import { Request, Response } from 'express';
import { performance } from 'perf_hooks';
import { metricsService } from './metrics.service';
import { loggingService } from './logging.service';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  error?: string;
  details?: Record<string, any>;
  lastChecked: string;
}

interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  version: string;
  uptime: number;
  timestamp: string;
  checks: HealthCheck[];
  system: {
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    load: number[];
    platform: string;
    nodeVersion: string;
  };
  services: {
    database: HealthCheck;
    cache?: HealthCheck;
    storage?: HealthCheck;
    email?: HealthCheck;
    external?: HealthCheck[];
  };
  metrics: {
    requests: {
      total: number;
      errors: number;
      averageResponseTime: number;
    };
    business: Record<string, number>;
  };
}

interface HealthCheckConfig {
  timeout: number;
  interval: number;
  retries: number;
  enabled: boolean;
}

type HealthCheckFunction = () => Promise<HealthCheck>;

class HealthMonitoringService {
  private healthChecks: Map<string, HealthCheckFunction> = new Map();
  private healthResults: Map<string, HealthCheck> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private config: HealthCheckConfig;

  constructor(config?: Partial<HealthCheckConfig>) {
    this.config = {
      timeout: 5000,
      interval: 30000, // 30 seconds
      retries: 3,
      enabled: true,
      ...config,
    };

    this.registerDefaultHealthChecks();

    if (this.config.enabled) {
      this.startMonitoring();
    }
  }

  private registerDefaultHealthChecks(): void {
    // System health check
    this.registerHealthCheck('system', this.checkSystemHealth.bind(this));

    // Application health check
    this.registerHealthCheck(
      'application',
      this.checkApplicationHealth.bind(this)
    );

    // Memory health check
    this.registerHealthCheck('memory', this.checkMemoryHealth.bind(this));

    // Event loop health check
    this.registerHealthCheck(
      'event_loop',
      this.checkEventLoopHealth.bind(this)
    );
  }

  registerHealthCheck(name: string, checkFunction: HealthCheckFunction): void {
    this.healthChecks.set(name, checkFunction);
    loggingService.info(`Registered health check: ${name}`);
  }

  unregisterHealthCheck(name: string): void {
    this.healthChecks.delete(name);
    this.healthResults.delete(name);
    loggingService.info(`Unregistered health check: ${name}`);
  }

  async executeHealthCheck(name: string): Promise<HealthCheck> {
    const checkFunction = this.healthChecks.get(name);
    if (!checkFunction) {
      throw new Error(`Health check '${name}' not found`);
    }

    const startTime = performance.now();
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.config.retries) {
      try {
        const result = await Promise.race([
          checkFunction(),
          new Promise<HealthCheck>((_, reject) =>
            setTimeout(
              () => reject(new Error('Health check timeout')),
              this.config.timeout
            )
          ),
        ]);

        result.latency = performance.now() - startTime;
        result.lastChecked = new Date().toISOString();

        this.healthResults.set(name, result);
        return result;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt < this.config.retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
    }

    // All retries failed
    const failedResult: HealthCheck = {
      name,
      status: 'unhealthy',
      latency: performance.now() - startTime,
      error: lastError?.message || 'Unknown error',
      lastChecked: new Date().toISOString(),
    };

    this.healthResults.set(name, failedResult);
    return failedResult;
  }

  async executeAllHealthChecks(): Promise<HealthCheck[]> {
    const promises = Array.from(this.healthChecks.keys()).map((name) =>
      this.executeHealthCheck(name)
    );

    return Promise.allSettled(promises).then((results) =>
      results.map((result, index) => {
        const checkName = Array.from(this.healthChecks.keys())[index];
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            name: checkName,
            status: 'unhealthy' as const,
            error: result.reason?.message || 'Health check failed',
            lastChecked: new Date().toISOString(),
          };
        }
      })
    );
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const checks = await this.executeAllHealthChecks();
    const overallStatus = this.determineOverallStatus(checks);

    const systemInfo = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      load: [0, 0, 0], // os.loadavg() equivalent for Windows
      platform: process.platform,
      nodeVersion: process.version,
    };

    const metrics = metricsService.getSummary();

    return {
      status: overallStatus,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks,
      system: systemInfo,
      services: {
        database: this.healthResults.get('database') || {
          name: 'database',
          status: 'unhealthy',
          error: 'Not checked',
          lastChecked: new Date().toISOString(),
        },
      },
      metrics: {
        requests: metrics.requests,
        business: metrics.business,
      },
    };
  }

  private determineOverallStatus(
    checks: HealthCheck[]
  ): 'healthy' | 'unhealthy' | 'degraded' {
    const unhealthyChecks = checks.filter(
      (check) => check.status === 'unhealthy'
    );
    const degradedChecks = checks.filter(
      (check) => check.status === 'degraded'
    );

    if (unhealthyChecks.length > 0) {
      return 'unhealthy';
    } else if (degradedChecks.length > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  private async checkSystemHealth(): Promise<HealthCheck> {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Check if system is under stress
    const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const isMemoryHigh = memoryUsagePercent > 90;
    const isUptimeLow = uptime < 60; // Less than 1 minute

    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    let details: Record<string, any> = {
      uptime,
      memoryUsage: memUsage,
      memoryUsagePercent: Math.round(memoryUsagePercent),
    };

    if (isMemoryHigh) {
      status = 'degraded';
      details.warning = 'High memory usage detected';
    }

    if (isUptimeLow) {
      status = 'degraded';
      details.warning = 'System recently started';
    }

    return {
      name: 'system',
      status,
      details,
      lastChecked: new Date().toISOString(),
    };
  }

  private async checkApplicationHealth(): Promise<HealthCheck> {
    try {
      // Check if application is responding
      const metrics = metricsService.getSummary();
      const errorRate =
        metrics.requests.total > 0
          ? (metrics.requests.errors / metrics.requests.total) * 100
          : 0;

      let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      let details: Record<string, any> = {
        totalRequests: metrics.requests.total,
        errorRate: Math.round(errorRate * 100) / 100,
        averageResponseTime: Math.round(metrics.requests.averageResponseTime),
      };

      if (errorRate > 10) {
        status = 'degraded';
        details.warning = 'High error rate detected';
      }

      if (errorRate > 50) {
        status = 'unhealthy';
        details.error = 'Very high error rate detected';
      }

      return {
        name: 'application',
        status,
        details,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'application',
        status: 'unhealthy',
        error: (error as Error).message,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkMemoryHealth(): Promise<HealthCheck> {
    const memUsage = process.memoryUsage();
    const totalMB = Math.round(memUsage.rss / 1024 / 1024);
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    const details = {
      totalMB,
      heapUsedMB,
      heapTotalMB,
      heapUsagePercent: Math.round(heapUsagePercent),
    };

    if (heapUsagePercent > 85) {
      status = 'degraded';
    }

    if (heapUsagePercent > 95) {
      status = 'unhealthy';
    }

    return {
      name: 'memory',
      status,
      details,
      lastChecked: new Date().toISOString(),
    };
  }

  private async checkEventLoopHealth(): Promise<HealthCheck> {
    return new Promise((resolve) => {
      const start = performance.now();

      setImmediate(() => {
        const lag = performance.now() - start;
        let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

        if (lag > 100) {
          status = 'degraded';
        }

        if (lag > 1000) {
          status = 'unhealthy';
        }

        resolve({
          name: 'event_loop',
          status,
          details: {
            lagMs: Math.round(lag),
          },
          lastChecked: new Date().toISOString(),
        });
      });
    });
  }

  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.executeAllHealthChecks();
        loggingService.debug('Health checks completed');
      } catch (error) {
        loggingService.error('Error during health monitoring', error as Error);
      }
    }, this.config.interval);

    loggingService.info(
      `Health monitoring started with ${this.config.interval}ms interval`
    );
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      loggingService.info('Health monitoring stopped');
    }
  }

  // Express middleware for health endpoints
  healthEndpoint() {
    return async (req: Request, res: Response): Promise<void> => {
      try {
        const health = await this.getSystemHealth();
        const statusCode =
          health.status === 'healthy'
            ? 200
            : health.status === 'degraded'
              ? 200
              : 503;

        res.status(statusCode).json(health);
      } catch (error) {
        loggingService.error('Health endpoint error', error as Error);
        res.status(503).json({
          status: 'unhealthy',
          error: 'Health check failed',
          timestamp: new Date().toISOString(),
        });
      }
    };
  }

  // Simple readiness probe
  readinessProbe() {
    return async (req: Request, res: Response): Promise<void> => {
      const isReady =
        this.healthResults.size > 0 &&
        Array.from(this.healthResults.values()).every(
          (check) => check.status !== 'unhealthy'
        );

      if (isReady) {
        res.status(200).json({ status: 'ready' });
      } else {
        res.status(503).json({ status: 'not ready' });
      }
    };
  }

  // Simple liveness probe
  livenessProbe() {
    return (req: Request, res: Response): void => {
      res.status(200).json({
        status: 'alive',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    };
  }

  // Metrics endpoint for Prometheus
  metricsEndpoint() {
    return (req: Request, res: Response): void => {
      try {
        const metrics = metricsService.getMetricsForExport();
        res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        res.send(metrics);
      } catch (error) {
        loggingService.error('Metrics endpoint error', error as Error);
        res.status(500).send('Error generating metrics');
      }
    };
  }
}

// Create singleton instance
export const healthMonitoring = new HealthMonitoringService();

// Export types
export type {
  HealthCheck,
  SystemHealth,
  HealthCheckConfig,
  HealthCheckFunction,
};
