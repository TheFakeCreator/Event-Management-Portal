# Monitoring and Incident Response Runbook

## Table of Contents

1. [Emergency Contacts](#emergency-contacts)
2. [Critical Alert Responses](#critical-alert-responses)
3. [Common Issues and Solutions](#common-issues-and-solutions)
4. [Escalation Procedures](#escalation-procedures)
5. [Monitoring Health Checks](#monitoring-health-checks)
6. [Performance Troubleshooting](#performance-troubleshooting)
7. [Recovery Procedures](#recovery-procedures)

## Emergency Contacts

### On-Call Rotation

| Team     | Primary         | Secondary       | Escalation                |
| -------- | --------------- | --------------- | ------------------------- |
| Platform | +1-XXX-XXX-XXXX | +1-XXX-XXX-XXXX | platform-lead@company.com |
| Backend  | +1-XXX-XXX-XXXX | +1-XXX-XXX-XXXX | backend-lead@company.com  |
| DevOps   | +1-XXX-XXX-XXXX | +1-XXX-XXX-XXXX | devops-lead@company.com   |

### Communication Channels

- **Critical Incidents**: #incident-response
- **General Alerts**: #monitoring-alerts
- **Status Updates**: #system-status

## Critical Alert Responses

### 1. High Error Rate (>5%)

**Symptoms**: 
- Alert: `EventManagement_HighErrorRate`
- Dashboard: Application Overview > Error Rate panel

**Immediate Actions**:
```bash
# 1. Check application logs
kubectl logs -f deployment/backend --tail=100

# 2. Check error distribution
curl "http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~'5..'}[5m])"

# 3. Check database connectivity
kubectl exec -it backend-pod -- npm run db:check
```

**Investigation Steps**:
1. Identify error patterns in logs
2. Check recent deployments
3. Verify database and Redis connectivity
4. Check third-party service status (Cloudinary, email)

**Resolution**:
- If deployment-related: Rollback to previous version
- If database-related: Check connection pool, restart if necessary
- If external service: Implement fallback or notify users

### 2. High Response Time (>2s)

**Symptoms**:
- Alert: `EventManagement_HighResponseTime`
- Dashboard: Application Overview > Response Time panel

**Immediate Actions**:
```bash
# 1. Check current response times
curl -w "@curl-format.txt" -o /dev/null -s "http://your-app.com/api/health"

# 2. Check database query performance
kubectl exec -it mongodb-pod -- mongo --eval "db.runCommand({currentOp: 1})"

# 3. Check system resources
kubectl top nodes
kubectl top pods
```

**Investigation Steps**:
1. Identify slow endpoints using APM
2. Check database query performance
3. Verify cache hit rates
4. Check for memory leaks or high CPU

**Resolution**:
- Optimize slow database queries
- Increase cache TTL if appropriate
- Scale application horizontally
- Restart services if memory leak detected

### 3. Service Down

**Symptoms**:
- Alert: `EventManagement_ServiceDown`
- Dashboard: Application Overview > Service Status

**Immediate Actions**:
```bash
# 1. Check service status
kubectl get pods -l app=backend
kubectl describe pod <pod-name>

# 2. Check service logs
kubectl logs -f <pod-name> --previous

# 3. Check resource constraints
kubectl describe node <node-name>
```

**Investigation Steps**:
1. Check pod restart reason
2. Verify resource limits
3. Check node capacity
4. Review recent changes

**Resolution**:
- Restart failed pods: `kubectl delete pod <pod-name>`
- Scale resources if needed
- Fix configuration issues
- Investigate and fix root cause

### 4. Database Connection Issues

**Symptoms**:
- Alert: `MongoDB_HighConnectionFailures`
- Dashboard: Infrastructure > MongoDB Connections

**Immediate Actions**:
```bash
# 1. Check MongoDB status
kubectl exec -it mongodb-pod -- mongo --eval "db.runCommand({serverStatus: 1})"

# 2. Check connection pool
kubectl exec -it backend-pod -- npm run db:pool:status

# 3. Check network connectivity
kubectl exec -it backend-pod -- nc -zv mongodb-service 27017
```

**Investigation Steps**:
1. Check connection pool exhaustion
2. Verify network policies
3. Check MongoDB resource usage
4. Review authentication issues

**Resolution**:
- Increase connection pool size
- Restart MongoDB if necessary
- Check and fix network policies
- Scale MongoDB resources

### 5. High Memory Usage (>90%)

**Symptoms**:
- Alert: `Node_HighMemoryUsage`
- Dashboard: Infrastructure > Memory Usage

**Immediate Actions**:
```bash
# 1. Check memory usage by process
kubectl exec -it <pod-name> -- ps aux --sort=-%mem

# 2. Check for memory leaks
kubectl exec -it <pod-name> -- node --inspect=0.0.0.0:9229 server.js &
# Connect with Chrome DevTools

# 3. Check system memory
kubectl describe node <node-name>
```

**Investigation Steps**:
1. Identify memory-intensive processes
2. Check for memory leaks in application
3. Verify garbage collection behavior
4. Check for cache size issues

**Resolution**:
- Restart affected services
- Implement memory limits
- Fix memory leaks in code
- Scale resources or nodes

## Common Issues and Solutions

### Issue: Prometheus Not Scraping Metrics

**Symptoms**:
- Missing data in Grafana dashboards
- Target down in Prometheus UI

**Diagnosis**:
```bash
# Check Prometheus targets
curl http://prometheus:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health != "up")'

# Check service discovery
kubectl get endpoints
kubectl get services -l prometheus.io/scrape=true
```

**Solution**:
1. Verify service annotations for scraping
2. Check network policies
3. Verify metrics endpoint accessibility
4. Restart Prometheus if configuration changed

### Issue: Grafana Dashboard Not Loading

**Symptoms**:
- Dashboard shows "No data" or loading errors
- Datasource connection failures

**Diagnosis**:
```bash
# Check Grafana logs
kubectl logs -f deployment/grafana

# Test datasource connectivity
curl -H "Authorization: Bearer <token>" \
  http://grafana:3000/api/datasources/proxy/1/api/v1/query?query=up
```

**Solution**:
1. Verify Prometheus datasource configuration
2. Check Grafana-Prometheus connectivity
3. Verify dashboard query syntax
4. Restart Grafana if necessary

### Issue: Alerts Not Firing

**Symptoms**:
- Expected alerts not triggered
- Alertmanager shows no alerts

**Diagnosis**:
```bash
# Check alert rules
kubectl exec -it prometheus-pod -- promtool check rules /etc/prometheus/rules/*.yml

# Check alert evaluation
curl http://prometheus:9090/api/v1/alerts | jq '.data.alerts[] | select(.state != "inactive")'

# Check Alertmanager
curl http://alertmanager:9093/api/v1/alerts
```

**Solution**:
1. Verify alert rule syntax
2. Check alert thresholds
3. Verify Alertmanager configuration
4. Check notification channel setup

## Escalation Procedures

### Severity Levels

#### Critical (P1)
- **Timeline**: Response within 15 minutes
- **Criteria**: Complete service outage, data loss, security breach
- **Actions**: 
  1. Page on-call engineer immediately
  2. Create incident channel
  3. Notify management within 30 minutes

#### High (P2)
- **Timeline**: Response within 1 hour
- **Criteria**: Major feature broken, significant performance degradation
- **Actions**:
  1. Notify on-call engineer
  2. Create incident ticket
  3. Begin investigation

#### Medium (P3)
- **Timeline**: Response within 4 hours
- **Criteria**: Minor feature issues, minor performance impact
- **Actions**:
  1. Create ticket for next business day
  2. Document in monitoring channel

#### Low (P4)
- **Timeline**: Response within 24 hours
- **Criteria**: Informational alerts, minor issues
- **Actions**:
  1. Log for trend analysis
  2. Address during regular maintenance

### Incident Response Process

1. **Detection**: Alert triggered or issue reported
2. **Assessment**: Determine severity level
3. **Response**: Execute appropriate response plan
4. **Communication**: Update stakeholders regularly
5. **Resolution**: Implement fix and verify
6. **Post-Mortem**: Conduct blameless post-mortem

## Monitoring Health Checks

### Daily Checks

```bash
#!/bin/bash
# monitoring-health-check.sh

echo "=== Monitoring Health Check ==="

# Check Prometheus
if curl -sf http://prometheus:9090/-/healthy > /dev/null; then
  echo "✅ Prometheus: Healthy"
else
  echo "❌ Prometheus: Unhealthy"
fi

# Check Grafana
if curl -sf http://grafana:3000/api/health > /dev/null; then
  echo "✅ Grafana: Healthy"
else
  echo "❌ Grafana: Unhealthy"
fi

# Check Alertmanager
if curl -sf http://alertmanager:9093/-/healthy > /dev/null; then
  echo "✅ Alertmanager: Healthy"
else
  echo "❌ Alertmanager: Unhealthy"
fi

# Check critical alerts
CRITICAL_ALERTS=$(curl -s http://prometheus:9090/api/v1/alerts | jq '.data.alerts[] | select(.labels.severity == "critical") | length')
echo "🔥 Critical Alerts: $CRITICAL_ALERTS"
```

### Weekly Maintenance

1. **Review Alert Trends**:
   ```bash
   # Check alert frequency
   curl 'http://prometheus:9090/api/v1/query?query=increase(prometheus_notifications_total[7d])'
   ```

2. **Dashboard Performance**:
   - Review query performance in Grafana
   - Optimize slow-loading dashboards
   - Archive unused dashboards

3. **Storage Cleanup**:
   ```bash
   # Check Prometheus storage
   kubectl exec -it prometheus-pod -- du -sh /prometheus
   
   # Clean old data if needed
   kubectl exec -it prometheus-pod -- find /prometheus -name "*.tmp" -delete
   ```

## Performance Troubleshooting

### High CPU Usage

1. **Identify CPU-intensive processes**:
   ```bash
   kubectl exec -it <pod> -- top -p $(pgrep -d, node)
   ```

2. **Check Node.js performance**:
   ```bash
   # Enable profiling
   kubectl exec -it <pod> -- node --prof server.js
   
   # Generate flame graph
   kubectl exec -it <pod> -- node --prof-process isolate-*.log > profile.txt
   ```

3. **Database query optimization**:
   ```bash
   # MongoDB slow query log
   kubectl exec -it mongodb-pod -- mongo --eval "db.setProfilingLevel(1, {slowms: 100})"
   ```

### Memory Leaks

1. **Heap dump analysis**:
   ```bash
   # Generate heap dump
   kubectl exec -it <pod> -- node --inspect server.js &
   # Use Chrome DevTools to capture heap snapshot
   ```

2. **Memory monitoring**:
   ```bash
   # Check memory usage trend
   curl 'http://prometheus:9090/api/v1/query_range?query=process_resident_memory_bytes&start=2024-01-01T00:00:00Z&end=2024-01-07T23:59:59Z&step=1h'
   ```

### Network Issues

1. **Connection testing**:
   ```bash
   # Test connectivity between services
   kubectl exec -it backend-pod -- nc -zv mongodb-service 27017
   kubectl exec -it backend-pod -- nc -zv redis-service 6379
   ```

2. **DNS resolution**:
   ```bash
   # Test DNS resolution
   kubectl exec -it backend-pod -- nslookup mongodb-service
   ```

## Recovery Procedures

### Service Recovery

1. **Graceful restart**:
   ```bash
   # Rolling restart
   kubectl rollout restart deployment/backend
   kubectl rollout status deployment/backend
   ```

2. **Emergency restart**:
   ```bash
   # Force restart all pods
   kubectl delete pods -l app=backend
   ```

### Database Recovery

1. **MongoDB replica set issues**:
   ```bash
   # Check replica set status
   kubectl exec -it mongodb-0 -- mongo --eval "rs.status()"
   
   # Reconfigure if needed
   kubectl exec -it mongodb-0 -- mongo --eval "rs.reconfig(config, {force: true})"
   ```

2. **Connection pool reset**:
   ```bash
   # Reset connection pool
   kubectl exec -it backend-pod -- npm run db:pool:reset
   ```

### Cache Recovery

1. **Redis cluster recovery**:
   ```bash
   # Check cluster status
   kubectl exec -it redis-0 -- redis-cli cluster nodes
   
   # Fix cluster if needed
   kubectl exec -it redis-0 -- redis-cli --cluster fix redis-service:6379
   ```

### Monitoring Stack Recovery

1. **Prometheus recovery**:
   ```bash
   # Check data integrity
   kubectl exec -it prometheus-pod -- promtool tsdb analyze /prometheus
   
   # Restart if corrupted
   kubectl delete pod prometheus-0
   ```

2. **Grafana recovery**:
   ```bash
   # Restore from backup
   kubectl cp grafana-backup.tar.gz grafana-0:/var/lib/grafana/
   kubectl exec -it grafana-0 -- tar -xzf /var/lib/grafana/grafana-backup.tar.gz
   ```

---

**Remember**: Always document incidents and update this runbook based on new learnings and procedures. Keep contact information and procedures up to date.