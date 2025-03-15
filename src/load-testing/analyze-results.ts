import fs from 'fs';
import path from 'path';

// Path to the results directory
const resultsDir = path.join(process.cwd(), 'load-test-results');

// Check if results directory exists
if (!fs.existsSync(resultsDir)) {
  console.error('Results directory not found. Run load tests first.');
  process.exit(1);
}

// Get all JSON files in the results directory
const resultFiles = fs
  .readdirSync(resultsDir)
  .filter(
    (file) => file.startsWith('account-creation-') && file.endsWith('.json'),
  )
  .map((file) => path.join(resultsDir, file));

if (resultFiles.length === 0) {
  console.error('No result files found. Run load tests first.');
  process.exit(1);
}

// Interface for the result data
interface TestResult {
  url: string;
  connections: number;
  pipelining: number;
  workers: number;
  duration: number;
  start: string;
  finish: string;
  requests: {
    average: number;
    mean: number;
    stddev: number;
    min: number;
    max: number;
    total: number;
    p0_001: number;
    p0_01: number;
    p0_1: number;
    p1: number;
    p2_5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p97_5: number;
    p99: number;
    p99_9: number;
    p99_99: number;
    p99_999: number;
    sent: number;
  };
  latency: {
    average: number;
    mean: number;
    stddev: number;
    min: number;
    max: number;
    p0_001: number;
    p0_01: number;
    p0_1: number;
    p1: number;
    p2_5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p97_5: number;
    p99: number;
    p99_9: number;
    p99_99: number;
    p99_999: number;
  };
  throughput: {
    average: number;
    mean: number;
    stddev: number;
    min: number;
    max: number;
    total: number;
    p0_001: number;
    p0_01: number;
    p0_1: number;
    p1: number;
    p2_5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p97_5: number;
    p99: number;
    p99_9: number;
    p99_99: number;
    p99_999: number;
  };
  errors: number;
  timeouts: number;
  mismatches: number;
  non2xx: number;
  resets: number;
  '1xx': number;
  '2xx': number;
  '3xx': number;
  '4xx': number;
  '5xx': number;
  statusCodeStats: Record<string, number>;
}

// Parse all result files
const results: TestResult[] = [];
for (const file of resultFiles) {
  try {
    const data = fs.readFileSync(file, 'utf8');
    const result = JSON.parse(data) as TestResult;
    results.push(result);
  } catch (error) {
    console.error(`Error parsing ${file}:`, error);
  }
}

// Sort results by requests per second (descending)
results.sort((a, b) => b.requests.average - a.requests.average);

// Generate summary report
console.log('=== DynamoDB Account Creation Load Test Results ===\n');
console.log('Results sorted by requests per second (highest first):\n');

console.log(
  '| Test | Connections | Pipelining | Workers | Requests/sec | Latency (avg) | Latency (p99) | Success Rate |',
);
console.log(
  '|------|-------------|------------|---------|--------------|---------------|---------------|--------------|',
);

results.forEach((result, index) => {
  const testName = path
    .basename(resultFiles[index])
    .replace('account-creation-', '')
    .replace('.json', '');
  const successRate = (result['2xx'] / (result.requests.total || 1)) * 100;

  console.log(
    `| ${testName} | ${result.connections} | ${result.pipelining} | ${result.workers} | ` +
      `${result.requests.average.toFixed(2)} | ${result.latency.average.toFixed(2)} ms | ` +
      `${result.latency.p99.toFixed(2)} ms | ${successRate.toFixed(2)}% |`,
  );
});

console.log('\n=== Detailed Analysis ===\n');

// Find the test with the highest throughput
const bestTest = results[0];
console.log(
  `Best Performance: ${bestTest.requests.average.toFixed(2)} requests/sec`,
);
console.log(
  `Configuration: ${bestTest.connections} connections, ${bestTest.pipelining} pipelining, ${bestTest.workers} workers`,
);
console.log(`Average Latency: ${bestTest.latency.average.toFixed(2)} ms`);
console.log(`p99 Latency: ${bestTest.latency.p99.toFixed(2)} ms`);
console.log(
  `Success Rate: ${((bestTest['2xx'] / (bestTest.requests.total || 1)) * 100).toFixed(2)}%`,
);

// Calculate theoretical limits
const theoreticalLimit = bestTest.requests.average;
console.log(
  `\nTheoretical Limit: ~${Math.round(theoreticalLimit)} accounts/sec`,
);
console.log(
  `Estimated Daily Capacity: ~${Math.round(theoreticalLimit * 60 * 60 * 24).toLocaleString()} accounts/day`,
);

// Provide recommendations
console.log('\n=== Recommendations ===\n');
console.log('Based on the test results:');

if (bestTest.non2xx > 0) {
  console.log(
    '- There were non-2xx responses, which might indicate throttling or errors.',
  );
  console.log('  Consider reducing the load or increasing DynamoDB capacity.');
}

if (bestTest.latency.p99 > 1000) {
  console.log('- High p99 latency (>1000ms) indicates potential bottlenecks.');
  console.log('  Consider optimizing the database or application code.');
}

if (bestTest.requests.average < 100) {
  console.log('- Throughput is relatively low (<100 req/sec).');
  console.log(
    '  Consider using DynamoDB burst capacity or provisioned capacity for higher throughput.',
  );
} else {
  console.log(
    '- Throughput is good. For production, consider using provisioned capacity with the observed values.',
  );
}

console.log('\nFor production use:');
console.log(
  '- Monitor DynamoDB throttling events and adjust capacity as needed',
);
console.log(
  '- Consider implementing retry logic with exponential backoff for failed requests',
);
console.log(
  '- Use DynamoDB Auto Scaling to handle varying loads automatically',
);

// Save the analysis to a file
const analysisReport = `# DynamoDB Load Test Analysis Report

## Summary
- Best Performance: ${bestTest.requests.average.toFixed(2)} requests/sec
- Configuration: ${bestTest.connections} connections, ${bestTest.pipelining} pipelining, ${bestTest.workers} workers
- Average Latency: ${bestTest.latency.average.toFixed(2)} ms
- p99 Latency: ${bestTest.latency.p99.toFixed(2)} ms
- Success Rate: ${((bestTest['2xx'] / (bestTest.requests.total || 1)) * 100).toFixed(2)}%

## Theoretical Limits
- Estimated Maximum Throughput: ~${Math.round(theoreticalLimit)} accounts/sec
- Estimated Daily Capacity: ~${Math.round(theoreticalLimit * 60 * 60 * 24).toLocaleString()} accounts/day

## Detailed Results

| Test | Connections | Pipelining | Workers | Requests/sec | Latency (avg) | Latency (p99) | Success Rate |
|------|-------------|------------|---------|--------------|---------------|---------------|--------------|
${results
  .map((result, index) => {
    const testName = path
      .basename(resultFiles[index])
      .replace('account-creation-', '')
      .replace('.json', '');
    const successRate = (result['2xx'] / (result.requests.total || 1)) * 100;

    return (
      `| ${testName} | ${result.connections} | ${result.pipelining} | ${result.workers} | ` +
      `${result.requests.average.toFixed(2)} | ${result.latency.average.toFixed(2)} ms | ` +
      `${result.latency.p99.toFixed(2)} ms | ${successRate.toFixed(2)}% |`
    );
  })
  .join('\n')}

## Recommendations

Based on the test results:
${
  bestTest.non2xx > 0
    ? '- There were non-2xx responses, which might indicate throttling or errors.\n  Consider reducing the load or increasing DynamoDB capacity.\n'
    : ''
}
${
  bestTest.latency.p99 > 1000
    ? '- High p99 latency (>1000ms) indicates potential bottlenecks.\n  Consider optimizing the database or application code.\n'
    : ''
}
${
  bestTest.requests.average < 100
    ? '- Throughput is relatively low (<100 req/sec).\n  Consider using DynamoDB burst capacity or provisioned capacity for higher throughput.'
    : '- Throughput is good. For production, consider using provisioned capacity with the observed values.'
}

For production use:
- Monitor DynamoDB throttling events and adjust capacity as needed
- Consider implementing retry logic with exponential backoff for failed requests
- Use DynamoDB Auto Scaling to handle varying loads automatically
`;

fs.writeFileSync(path.join(resultsDir, 'analysis-report.md'), analysisReport);
console.log(
  `\nAnalysis report saved to ${path.join(resultsDir, 'analysis-report.md')}`,
);
