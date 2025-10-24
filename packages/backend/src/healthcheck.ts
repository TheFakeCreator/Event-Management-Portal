#!/usr/bin/env node

/**
 * Backend Health Check Script
 * Used in production to verify the backend service is running properly
 */

import http from 'http';
import process from 'process';

const port = process.env.PORT || 5000;
const host = process.env.HOST || 'localhost';

const options = {
  host,
  port,
  path: '/api/v1/health',
  method: 'GET',
  timeout: 5000,
};

const request = http.request(options, (response) => {
  console.log(`Health check status: ${response.statusCode}`);

  if (response.statusCode === 200) {
    console.log('✅ Backend is healthy');
    process.exit(0);
  } else {
    console.log('❌ Backend is unhealthy');
    process.exit(1);
  }
});

request.on('error', (error) => {
  console.log('❌ Backend health check failed:', error.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.log('❌ Backend health check timed out');
  request.destroy();
  process.exit(1);
});

request.setTimeout(5000);
request.end();
