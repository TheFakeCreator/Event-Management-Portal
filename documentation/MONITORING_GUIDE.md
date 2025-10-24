# Monitoring & Observability Guide

This document provides comprehensive guidance on monitoring, observability, and performance tracking for the Event Management Portal.

## Overview

The Event Management Portal implements a complete observability stack with:

- **Metrics Collection**: Prometheus-compatible metrics
- **Logging**: Structured logging with Winston
- **Health Monitoring**: Application and system health checks
- **Dashboards**: Grafana visualizations
- **Alerting**: Prometheus alerting rules
- **Performance Monitoring**: Request tracing and performance metrics

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │───▶│    Prometheus    │───▶│     Grafana     │
│                 │    │                  │    │                 │
│  - Metrics      │    │  - Data Storage  │    │  - Dashboards   │
│  - Health       │    │  - Alerting      │    │  - Visualization│
│  - Logs         │    │  - Rules         │    │  - Alerts UI    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Log Files     │    │  Time Series DB  │    │   Alert Manager │
│                 │    │                  │    │                 │
│  - Application  │    │  - Historical    │    │  - Notifications│
│  - Security     │    │    Data          │    │  - Routing      │
│  - Performance  │    │  - Aggregation   │    │  - Grouping     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Services Overview

### Logging Service

**Location**: `packages/shared/src/services/logging.service.ts`

The logging service provides structured, JSON-formatted logging with multiple specialized loggers:

#### Features

- **Correlation IDs**: Automatic request correlation tracking
- **Multiple Loggers**: Application, audit, security, performance logging
- **Log Rotation**: Daily log rotation with retention policies
- **Sanitization**: Automatic PII and sensitive data removal
- **Express Middleware**: Automatic request/response logging

#### Usage

```typescript
import { loggingService } from '@event-management/shared';

// Basic logging
loggingService.info('User logged in', { userId: '123' });
loggingService.error('Database error', error);

// Audit logging
loggingService.audit('user_login', {
  userId: '123',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});

// Security logging
loggingService.security('failed_login_attempt', {
  email: 'user@example.com',
  ip: '192.168.1.1',
  reason: 'invalid_password'
});

// Performance logging
loggingService.performance('database_query', {
  query: 'findUsers',
  duration: 150,
  records: 25
});
```

#### Express Middleware

```typescript
import express from 'express';
import { loggingService } from '@event-management/shared';

const app = express();

// Add request logging middleware
app.use(loggingService.middleware());
```

#### Log Levels

- **ERROR**: Application errors, exceptions
- **WARN**: Warnings, deprecated usage
- **INFO**: General information, business events
- **DEBUG**: Detailed debugging information

### Metrics Service

**Location**: `packages/shared/src/services/metrics.service.ts`

Prometheus-compatible metrics collection service for application and business metrics.

#### Features

- **HTTP Metrics**: Request rates, response times, status codes
- **System Metrics**: Memory usage, CPU usage, event loop lag
- **Business Metrics**: Events created, user registrations, custom counters
- **Performance Tracking**: Database query times, API response times
- **Custom Metrics**: Extensible metric definitions

#### Metric Types

1. **Counters**: Monotonically increasing values
2. **Gauges**: Values that can go up and down
3. **Histograms**: Distributions of values

#### Usage

```typescript
import { metricsService } from '@event-management/shared';

// Increment counters
metricsService.incrementCounter('events_created');
metricsService.incrementCounter('user_registrations', { type: 'event' });

// Set gauge values
metricsService.setGauge('active_users', 150);
metricsService.setGauge('database_connections', 25);

// Record histograms
metricsService.recordHistogram('http_request_duration', 0.25);
metricsService.recordHistogram('db_query_time', 0.15, { table: 'events' });

// Track business metrics
metricsService.trackBusinessMetric('revenue', 1500);
metricsService.trackBusinessMetric('conversions', 1, { source: 'email' });
```

#### Express Middleware

```typescript
import express from 'express';
import { metricsService } from '@event-management/shared';

const app = express();

// Add metrics middleware
app.use(metricsService.middleware());

// Metrics endpoint
app.get('/metrics', metricsService.metricsEndpoint());
```

### Health Monitoring Service

**Location**: `packages/shared/src/services/health-monitoring.service.ts`

Comprehensive health monitoring with built-in checks and custom check support.

#### Features

- **System Health**: Memory, CPU, event loop monitoring
- **Service Health**: Database, cache, external service monitoring
- **Custom Health Checks**: Extensible health check framework
- **Health Endpoints**: REST endpoints for health status
- **Automatic Monitoring**: Scheduled health check execution

#### Built-in Health Checks

1. **System Health**: Memory usage, uptime, platform info
2. **Application Health**: Error rates, response times
3. **Memory Health**: Heap usage, memory pressure
4. **Event Loop Health**: Event loop lag detection

#### Custom Health Checks

```typescript
import { healthMonitoring } from '@event-management/shared';

// Register custom health check
healthMonitoring.registerHealthCheck('database', async () => {
  try {
    await mongoose.connection.db.admin().ping();
    return {
      name: 'database',
      status: 'healthy',
      details: { connection: 'active' },
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
});
```

#### Health Endpoints

```typescript
import express from 'express';
import { healthMonitoring } from '@event-management/shared';

const app = express();

// Health endpoints
app.get('/health', healthMonitoring.healthEndpoint());
app.get('/health/live', healthMonitoring.livenessProbe());
app.get('/health/ready', healthMonitoring.readinessProbe());
```

## Prometheus Configuration

**Location**: `monitoring/prometheus/prometheus.yml`

### Scrape Configuration

The Prometheus configuration defines scrape targets for all application components:

```yaml
scrape_configs:
  # Backend metrics
  - job_name: 'event-management-backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  # Database metrics
  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb-exporter:9216']

  # System metrics
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

### Alert Rules

**Location**: `monitoring/prometheus/rules/alerts.yml`

#### Application Alerts

- **High Error Rate**: > 10% error rate for 5 minutes
- **High Response Time**: > 2s 95th percentile for 5 minutes
- **Application Down**: Service unavailable for 1 minute

#### System Alerts

- **High Memory Usage**: > 90% memory usage for 10 minutes
- **High CPU Usage**: > 80% CPU usage for 10 minutes
- **Disk Space Low**: < 10% disk space available

#### Business Alerts

- **Low Event Creation**: Unusual drop in event creation rate
- **High Registration Failures**: > 20% registration failure rate
- **High Failed Logins**: > 50% failed login rate

## Grafana Dashboards

**Location**: `monitoring/grafana/dashboards/`

### Main Dashboard

The main dashboard provides an overview of system health and performance:

#### Panels

1. **System Status**: Service availability indicators
2. **Request Rate**: HTTP requests per second
3. **Response Time**: 50th and 95th percentile response times
4. **Error Rate**: HTTP 4xx and 5xx error rates
5. **System Resources**: Memory, CPU, disk usage
6. **Business Metrics**: Events, users, registrations

#### Variables

- **Instance**: Filter by application instance
- **Time Range**: Configurable time range selector

### Custom Dashboards

Create custom dashboards for specific monitoring needs:

```json
{
  "dashboard": {
    "title": "Event Management - Security",
    "panels": [
      {
        "title": "Failed Login Attempts",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(auth_login_attempts_failed_total[5m])",
            "legendFormat": "Failed Logins/sec"
          }
        ]
      }
    ]
  }
}
```

## Deployment Monitoring

### Docker Compose Setup

The production Docker Compose includes full monitoring stack:

```yaml
services:
  backend:
    image: event-management-backend
    environment:
      - PROMETHEUS_ENABLED=true
    ports:
      - "3000:3000"

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus:/etc/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Health Check Integration

Configure Docker health checks using application endpoints:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

## Monitoring Best Practices

### Metric Naming

Follow Prometheus naming conventions:

- Use snake_case: `http_requests_total`
- Include units: `response_time_seconds`
- Use suffixes: `_total`, `_count`, `_sum`, `_bucket`

### Log Structured Data

Always use structured logging with consistent fields:

```typescript
// Good
logger.info('User registered', {
  userId: '123',
  email: 'user@example.com',
  registrationMethod: 'email'
});

// Bad
logger.info(`User ${userId} registered with email ${email}`);
```

### Health Check Guidelines

1. **Fast Checks**: Keep health checks under 5 seconds
2. **Meaningful Status**: Return actionable health information
3. **Dependency Checks**: Monitor critical dependencies
4. **Graceful Degradation**: Handle partial system failures

### Alert Design

1. **Actionable**: Alerts should require human intervention
2. **Clear Thresholds**: Use well-defined alert thresholds
3. **Context**: Include enough context for debugging
4. **Escalation**: Implement proper alert escalation

## Troubleshooting

### Common Issues

#### High Memory Usage

1. Check heap dumps: `curl http://localhost:3000/health`
2. Analyze memory patterns in Grafana
3. Review application logs for memory leaks
4. Monitor garbage collection metrics

#### High Response Times

1. Check database query performance
2. Analyze slow request logs
3. Review system resource usage
4. Check for blocking operations

#### Missing Metrics

1. Verify Prometheus scraping: `http://localhost:9090/targets`
2. Check application metrics endpoint: `http://localhost:3000/metrics`
3. Verify network connectivity
4. Check Prometheus configuration

### Log Analysis

Use structured queries to analyze logs:

```bash
# Find all errors in the last hour
grep '"level":"error"' logs/application.log | jq -r '.timestamp + " " + .message'

# Security events
grep '"type":"security"' logs/audit.log | jq -r '.event + " from " + .ip'

# Performance issues
grep '"duration"' logs/performance.log | jq 'select(.duration > 1000)'
```

### Metrics Analysis

Query Prometheus for debugging:

```promql
# Request rate by status
rate(http_requests_total[5m]) by (status)

# Memory usage trend
process_resident_memory_bytes

# Error rate percentage
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100
```

## Performance Optimization

### Metrics Performance

1. **Sampling**: Use sampling for high-frequency metrics
2. **Labels**: Limit label cardinality
3. **Retention**: Configure appropriate data retention
4. **Aggregation**: Pre-aggregate metrics when possible

### Log Performance

1. **Async Logging**: Use asynchronous log transport
2. **Log Rotation**: Implement proper log rotation
3. **Sampling**: Sample high-volume logs
4. **Compression**: Compress archived logs

### Monitoring Resource Usage

Monitor the monitoring stack itself:

```yaml
# Prometheus resource usage
prometheus_tsdb_head_memory_usage_bytes
prometheus_tsdb_symbol_table_size_bytes

# Grafana performance
grafana_http_request_duration_seconds
grafana_database_connections
```

## Integration Examples

### Backend Integration

```typescript
// app.ts
import express from 'express';
import {
  loggingService,
  metricsService,
  healthMonitoring
} from '@event-management/shared';

const app = express();

// Add monitoring middleware
app.use(loggingService.middleware());
app.use(metricsService.middleware());

// Health endpoints
app.get('/health', healthMonitoring.healthEndpoint());
app.get('/metrics', metricsService.metricsEndpoint());

// Register custom health checks
healthMonitoring.registerHealthCheck('database', checkDatabase);
healthMonitoring.registerHealthCheck('redis', checkRedis);
```

### Controller Integration

```typescript
import { Request, Response } from 'express';
import { loggingService, metricsService } from '@event-management/shared';

export const createEvent = async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Business logic
    const event = await EventService.create(req.body);
    
    // Track success metrics
    metricsService.incrementCounter('events_created', { 
      type: req.body.type 
    });
    
    loggingService.info('Event created', {
      eventId: event.id,
      userId: req.user.id,
      type: event.type
    });
    
    res.json({ success: true, data: event });
    
  } catch (error) {
    // Track error metrics
    metricsService.incrementCounter('events_creation_failed');
    
    loggingService.error('Event creation failed', error, {
      userId: req.user.id,
      input: req.body
    });
    
    res.status(500).json({ success: false, error: 'Creation failed' });
  } finally {
    // Track performance
    const duration = (Date.now() - startTime) / 1000;
    metricsService.recordHistogram('event_creation_duration', duration);
  }
};
```

This comprehensive monitoring setup provides complete observability into the Event Management Portal's performance, health, and business metrics, enabling proactive monitoring and rapid issue resolution.