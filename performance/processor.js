/**
 * Artillery Performance Test Processor
 * Event Management Portal - Custom metrics and hooks
 */

const fs = require('fs');
const path = require('path');

// Performance metrics collection
let testMetrics = {
    startTime: null,
    endTime: null,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: Infinity,
    responseTimes: [],
    errorsByType: {},
    endpointMetrics: {}
};

/**
 * Initialize test run
 */
function beforeTest(requestParams, context, ee, next) {
    if (!testMetrics.startTime) {
        testMetrics.startTime = Date.now();
        console.log('🚀 Performance test started at:', new Date().toISOString());
    }
    return next();
}

/**
 * Track request metrics
 */
function beforeRequest(requestParams, context, ee, next) {
    requestParams.startTime = Date.now();
    testMetrics.totalRequests++;
    return next();
}

/**
 * Process response metrics
 */
function afterResponse(requestParams, response, context, ee, next) {
    const responseTime = Date.now() - requestParams.startTime;

    // Update response time metrics
    testMetrics.responseTimes.push(responseTime);
    testMetrics.maxResponseTime = Math.max(testMetrics.maxResponseTime, responseTime);
    testMetrics.minResponseTime = Math.min(testMetrics.minResponseTime, responseTime);

    // Track endpoint-specific metrics
    const endpoint = `${requestParams.method || 'GET'} ${requestParams.url}`;
    if (!testMetrics.endpointMetrics[endpoint]) {
        testMetrics.endpointMetrics[endpoint] = {
            requests: 0,
            successCount: 0,
            errorCount: 0,
            responseTimes: [],
            avgResponseTime: 0
        };
    }

    const endpointMetric = testMetrics.endpointMetrics[endpoint];
    endpointMetric.requests++;
    endpointMetric.responseTimes.push(responseTime);

    // Check if request was successful
    if (response.statusCode >= 200 && response.statusCode < 400) {
        testMetrics.successfulRequests++;
        endpointMetric.successCount++;
    } else {
        testMetrics.failedRequests++;
        endpointMetric.errorCount++;

        // Track error types
        const errorKey = `${response.statusCode}: ${response.statusMessage || 'Unknown'}`;
        testMetrics.errorsByType[errorKey] = (testMetrics.errorsByType[errorKey] || 0) + 1;
    }

    // Calculate average response times
    testMetrics.averageResponseTime = testMetrics.responseTimes.reduce((a, b) => a + b, 0) / testMetrics.responseTimes.length;
    endpointMetric.avgResponseTime = endpointMetric.responseTimes.reduce((a, b) => a + b, 0) / endpointMetric.responseTimes.length;

    return next();
}

/**
 * Custom scenario completion handler
 */
function scenarioCompleted(context, ee, next) {
    // Log scenario completion
    ee.emit('counter', 'scenarios.completed', 1);
    return next();
}

/**
 * Finalize test and generate report
 */
function afterTest(context, ee, next) {
    testMetrics.endTime = Date.now();
    const totalDuration = (testMetrics.endTime - testMetrics.startTime) / 1000; // seconds

    // Generate comprehensive performance report
    const report = {
        testSummary: {
            startTime: new Date(testMetrics.startTime).toISOString(),
            endTime: new Date(testMetrics.endTime).toISOString(),
            duration: `${totalDuration}s`,
            totalRequests: testMetrics.totalRequests,
            successfulRequests: testMetrics.successfulRequests,
            failedRequests: testMetrics.failedRequests,
            successRate: ((testMetrics.successfulRequests / testMetrics.totalRequests) * 100).toFixed(2) + '%',
            requestsPerSecond: (testMetrics.totalRequests / totalDuration).toFixed(2)
        },
        performanceMetrics: {
            averageResponseTime: `${testMetrics.averageResponseTime.toFixed(2)}ms`,
            minResponseTime: `${testMetrics.minResponseTime}ms`,
            maxResponseTime: `${testMetrics.maxResponseTime}ms`,
            p50ResponseTime: `${calculatePercentile(testMetrics.responseTimes, 50)}ms`,
            p90ResponseTime: `${calculatePercentile(testMetrics.responseTimes, 90)}ms`,
            p95ResponseTime: `${calculatePercentile(testMetrics.responseTimes, 95)}ms`,
            p99ResponseTime: `${calculatePercentile(testMetrics.responseTimes, 99)}ms`
        },
        errorAnalysis: testMetrics.errorsByType,
        endpointBreakdown: Object.entries(testMetrics.endpointMetrics).map(([endpoint, metrics]) => ({
            endpoint,
            requests: metrics.requests,
            successRate: `${((metrics.successCount / metrics.requests) * 100).toFixed(2)}%`,
            avgResponseTime: `${metrics.avgResponseTime.toFixed(2)}ms`,
            errors: metrics.errorCount
        }))
    };

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'performance', 'test-results.json');
    const summaryPath = path.join(process.cwd(), 'performance', 'test-summary.md');

    try {
        // Ensure directory exists
        const performanceDir = path.dirname(reportPath);
        if (!fs.existsSync(performanceDir)) {
            fs.mkdirSync(performanceDir, { recursive: true });
        }

        // Save JSON report
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Generate Markdown summary
        const markdownReport = generateMarkdownSummary(report);
        fs.writeFileSync(summaryPath, markdownReport);

        console.log('\n📊 Performance Test Results:');
        console.log('================================');
        console.log(`Total Requests: ${report.testSummary.totalRequests}`);
        console.log(`Success Rate: ${report.testSummary.successRate}`);
        console.log(`Average Response Time: ${report.performanceMetrics.averageResponseTime}`);
        console.log(`Requests/Second: ${report.testSummary.requestsPerSecond}`);
        console.log(`Test Duration: ${report.testSummary.duration}`);
        console.log('\nDetailed reports saved:');
        console.log(`- JSON: ${reportPath}`);
        console.log(`- Summary: ${summaryPath}`);

        // Check performance thresholds
        checkPerformanceThresholds(report);

    } catch (error) {
        console.error('❌ Failed to generate performance report:', error);
    }

    return next();
}

/**
 * Calculate percentile from array of response times
 */
function calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
}

/**
 * Generate Markdown summary report
 */
function generateMarkdownSummary(report) {
    return `# Performance Test Report

**Generated:** ${new Date().toISOString()}

## Test Summary

| Metric | Value |
|--------|-------|
| Total Requests | ${report.testSummary.totalRequests} |
| Success Rate | ${report.testSummary.successRate} |
| Failed Requests | ${report.testSummary.failedRequests} |
| Test Duration | ${report.testSummary.duration} |
| Requests/Second | ${report.testSummary.requestsPerSecond} |

## Response Time Metrics

| Metric | Value |
|--------|-------|
| Average | ${report.performanceMetrics.averageResponseTime} |
| Minimum | ${report.performanceMetrics.minResponseTime} |
| Maximum | ${report.performanceMetrics.maxResponseTime} |
| P50 (Median) | ${report.performanceMetrics.p50ResponseTime} |
| P90 | ${report.performanceMetrics.p90ResponseTime} |
| P95 | ${report.performanceMetrics.p95ResponseTime} |
| P99 | ${report.performanceMetrics.p99ResponseTime} |

## Endpoint Performance

| Endpoint | Requests | Success Rate | Avg Response Time | Errors |
|----------|----------|--------------|-------------------|---------|
${report.endpointBreakdown.map(ep =>
        `| ${ep.endpoint} | ${ep.requests} | ${ep.successRate} | ${ep.avgResponseTime} | ${ep.errors} |`
    ).join('\n')}

## Error Analysis

${Object.keys(report.errorAnalysis).length > 0 ?
            Object.entries(report.errorAnalysis).map(([error, count]) =>
                `- **${error}**: ${count} occurrences`
            ).join('\n') :
            'No errors detected during the test run.'
        }

## Recommendations

${generateRecommendations(report)}
`;
}

/**
 * Generate performance recommendations based on results
 */
function generateRecommendations(report) {
    const recommendations = [];

    const avgResponseTime = parseFloat(report.performanceMetrics.averageResponseTime);
    const successRate = parseFloat(report.testSummary.successRate);
    const p95ResponseTime = parseFloat(report.performanceMetrics.p95ResponseTime);

    if (avgResponseTime > 1000) {
        recommendations.push('⚠️ Average response time is above 1s - consider performance optimization');
    }

    if (successRate < 99) {
        recommendations.push('⚠️ Success rate is below 99% - investigate error sources');
    }

    if (p95ResponseTime > 2000) {
        recommendations.push('⚠️ 95th percentile response time is above 2s - check for performance bottlenecks');
    }

    if (Object.keys(report.errorAnalysis).length > 0) {
        recommendations.push('🔍 Errors detected - review error analysis for improvement opportunities');
    }

    if (recommendations.length === 0) {
        recommendations.push('✅ Performance metrics are within acceptable ranges');
    }

    return recommendations.join('\n');
}

/**
 * Check performance against defined thresholds
 */
function checkPerformanceThresholds(report) {
    const thresholds = {
        maxAvgResponseTime: 1000, // ms
        minSuccessRate: 99, // %
        maxP95ResponseTime: 2000 // ms
    };

    const avgResponseTime = parseFloat(report.performanceMetrics.averageResponseTime);
    const successRate = parseFloat(report.testSummary.successRate);
    const p95ResponseTime = parseFloat(report.performanceMetrics.p95ResponseTime);

    let passed = true;

    console.log('\n🎯 Performance Threshold Check:');
    console.log('================================');

    if (avgResponseTime > thresholds.maxAvgResponseTime) {
        console.log(`❌ Average response time (${avgResponseTime}ms) exceeds threshold (${thresholds.maxAvgResponseTime}ms)`);
        passed = false;
    } else {
        console.log(`✅ Average response time (${avgResponseTime}ms) within threshold`);
    }

    if (successRate < thresholds.minSuccessRate) {
        console.log(`❌ Success rate (${successRate}%) below threshold (${thresholds.minSuccessRate}%)`);
        passed = false;
    } else {
        console.log(`✅ Success rate (${successRate}%) meets threshold`);
    }

    if (p95ResponseTime > thresholds.maxP95ResponseTime) {
        console.log(`❌ P95 response time (${p95ResponseTime}ms) exceeds threshold (${thresholds.maxP95ResponseTime}ms)`);
        passed = false;
    } else {
        console.log(`✅ P95 response time (${p95ResponseTime}ms) within threshold`);
    }

    console.log(`\n${passed ? '✅ All performance thresholds passed!' : '❌ Some performance thresholds failed!'}`);

    // Set exit code for CI/CD pipeline
    if (!passed && process.env.CI) {
        process.exit(1);
    }
}

// Export functions for Artillery
module.exports = {
    beforeTest,
    beforeRequest,
    afterResponse,
    scenarioCompleted,
    afterTest
};