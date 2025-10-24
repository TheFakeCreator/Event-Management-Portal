# Production Monitoring and Alerting Setup Guide

## Overview

This guide provides comprehensive instructions for setting up and managing the production monitoring and alerting infrastructure for the Event Management Portal.

## Architecture

The monitoring stack consists of:

- **Prometheus**: Metrics collection and alerting engine
- **Grafana**: Visualization and dashboards
- **Alertmanager**: Alert routing and notifications
- **Node Exporter**: System metrics collection
- **cAdvisor**: Container metrics collection
- **Blackbox Exporter**: Endpoint monitoring
- **MongoDB Exporter**: Database metrics
- **Redis Exporter**: Cache metrics

## Quick Start

### 1. Prerequisites

```bash
# Install Docker and Docker Compose
docker --version
docker-compose --version

# Create monitoring network
docker network create monitoring
```

### 2. Deploy Monitoring Stack

```bash
# Start the complete monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Verify all services are running
docker-compose -f docker-compose.monitoring.yml ps
```

### 3. Access Dashboards

- **Grafana**: http://localhost:3000
  - Username: `admin`
  - Password: `admin123` (change on first login)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093

## Configuration Details

### Prometheus Configuration

Located in `monitoring/prometheus/prometheus.yml`:

```yaml
# Key scrape configurations
scrape_configs:
  - job_name: 'event-management-backend'
    static_configs:
      - targets: ['backend:5000']
    scrape_interval: 15s
    metrics_path: '/metrics'
```

**Important Settings:**
- Scrape interval: 15 seconds for application metrics
- Retention: 30 days for metrics storage
- Alert rules: Auto-loaded from `alerts/` directory

### Alert Rules

#### Application Alerts (`application-alerts.yml`)
- High response times (>2 seconds)
- Error rates (>5%)
- Low success rates (<95%)
- Memory/CPU thresholds
- Database connection issues

#### Infrastructure Alerts (`infrastructure-alerts.yml`)
- Container health issues
- System resource exhaustion
- Network connectivity problems
- SSL certificate expiration

### Grafana Dashboards

1. **Application Overview**: Key application metrics and health
2. **Business Metrics**: User engagement and business KPIs
3. **Infrastructure Overview**: System and container metrics

### Alertmanager Configuration

Located in `monitoring/alertmanager/alertmanager.yml`:

```yaml
# Route configuration
route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default-receiver'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
    - match:
        team: backend
      receiver: 'backend-team'
```

## Alert Channels Setup

### Slack Integration

1. Create a Slack webhook URL
2. Update Alertmanager configuration:

```yaml
receivers:
- name: 'slack-alerts'
  slack_configs:
  - api_url: 'YOUR_WEBHOOK_URL'
    channel: '#alerts'
    title: 'Event Management Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

### Email Notifications

```yaml
receivers:
- name: 'email-alerts'
  email_configs:
  - to: 'alerts@yourcompany.com'
    from: 'monitoring@yourcompany.com'
    smarthost: 'smtp.gmail.com:587'
    auth_username: 'your-email@gmail.com'
    auth_password: 'your-app-password'
    subject: 'Event Management Alert: {{ .GroupLabels.alertname }}'
```

### PagerDuty Integration

```yaml
receivers:
- name: 'pagerduty-critical'
  pagerduty_configs:
  - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
    description: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

## Monitoring Best Practices

### 1. Alert Management

- **Severity Levels**:
  - Critical: Immediate action required (page on-call)
  - Warning: Action required within business hours
  - Info: Informational, no action required

- **Alert Fatigue Prevention**:
  - Use appropriate thresholds
  - Implement alert grouping
  - Set proper repeat intervals
  - Create runbooks for common alerts

### 2. Dashboard Design

- **Key Principles**:
  - Start with high-level overview
  - Drill down to specific components
  - Use consistent color coding
  - Include relevant time ranges

- **Performance Optimization**:
  - Limit query complexity
  - Use appropriate refresh intervals
  - Implement dashboard variables

### 3. Retention Policies

```yaml
# Prometheus retention configuration
retention_policy:
  raw_data: 15d      # High resolution for 15 days
  downsampled: 90d   # Reduced resolution for 90 days
  aggregated: 1y     # Aggregated data for 1 year
```

## Troubleshooting

### Common Issues

#### 1. Prometheus Not Scraping Targets

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify service connectivity
docker exec -it prometheus wget -qO- http://backend:5000/metrics
```

#### 2. Grafana Dashboard Not Loading

```bash
# Check Grafana logs
docker logs grafana

# Verify Prometheus datasource
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/datasources
```

#### 3. Alerts Not Firing

```bash
# Check alert rules syntax
docker exec -it prometheus promtool check rules /etc/prometheus/alerts/*.yml

# Verify Alertmanager configuration
docker exec -it alertmanager amtool config show
```

### Debugging Commands

```bash
# View Prometheus configuration
docker exec -it prometheus cat /etc/prometheus/prometheus.yml

# Check alert status
curl http://localhost:9090/api/v1/alerts

# Test alert routing
docker exec -it alertmanager amtool config routes test \
  --config.file=/etc/alertmanager/alertmanager.yml \
  severity=critical team=backend
```

## Security Considerations

### 1. Network Security

```yaml
# Docker Compose network configuration
networks:
  monitoring:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### 2. Authentication

- Enable Grafana authentication
- Use service accounts for API access
- Implement proper RBAC

### 3. Data Protection

- Encrypt metrics in transit (TLS)
- Secure webhook URLs
- Implement proper firewall rules

## Scaling Considerations

### Horizontal Scaling

```yaml
# Prometheus federation for multiple instances
- job_name: 'federate'
  scrape_interval: 15s
  honor_labels: true
  metrics_path: '/federate'
  params:
    'match[]':
      - '{job=~"prometheus"}'
  static_configs:
    - targets:
      - 'prometheus-1:9090'
      - 'prometheus-2:9090'
```

### High Availability

- Deploy multiple Prometheus instances
- Use external storage (e.g., Thanos)
- Implement Alertmanager clustering
- Use load balancer for Grafana

## Maintenance

### Regular Tasks

1. **Weekly**:
   - Review alert trends
   - Check dashboard performance
   - Update retention policies

2. **Monthly**:
   - Review and update alert thresholds
   - Clean up unused dashboards
   - Update monitoring components

3. **Quarterly**:
   - Performance optimization
   - Security review
   - Capacity planning

### Backup Strategy

```bash
# Backup Grafana dashboards
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/search?type=dash-db | \
  jq -r '.[] | .uri' | \
  xargs -I {} curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/dashboards/{} > backup.json

# Backup Prometheus configuration
docker cp prometheus:/etc/prometheus/ ./prometheus-backup/
```

## Performance Tuning

### Prometheus Optimization

```yaml
# Prometheus configuration optimizations
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'event-management'
    replica: '1'

# Storage optimization
storage:
  tsdb:
    retention.time: 30d
    retention.size: 10GB
    wal-compression: true
```

### Grafana Optimization

```ini
# Grafana configuration optimizations
[database]
type = postgres  # Use PostgreSQL instead of SQLite
host = postgres:5432
name = grafana
user = grafana
password = grafana_password

[server]
enable_gzip = true
```

## Monitoring Metrics Reference

### Application Metrics

- `http_requests_total`: Total HTTP requests
- `http_request_duration_seconds`: Request duration
- `database_connections_active`: Active DB connections
- `cache_hits_total`: Cache hit count
- `user_registrations_total`: User registration count

### Infrastructure Metrics

- `node_cpu_seconds_total`: CPU usage
- `node_memory_MemAvailable_bytes`: Available memory
- `node_filesystem_free_bytes`: Filesystem usage
- `container_cpu_usage_seconds_total`: Container CPU
- `container_memory_working_set_bytes`: Container memory

## Support and Documentation

### Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)

### Contact Information

- **Platform Team**: platform-team@yourcompany.com
- **On-Call**: +1-XXX-XXX-XXXX
- **Slack Channel**: #monitoring-alerts

---

**Note**: Replace placeholder values (URLs, credentials, contact information) with actual production values before deployment.