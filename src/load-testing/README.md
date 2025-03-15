# DynamoDB Load Testing

This directory contains scripts for load testing the DynamoDB account creation API to determine theoretical throughput limits.

## Prerequisites

- Node.js (v23+)
- npm or yarn
- Running DynamoDB instance (local or AWS)
- Running API server

## Setup

Make sure you have installed the required dependencies:

```bash
npm install
```

## Available Scripts

### 1. Single Test

Run a single load test with specific parameters:

```bash
# Set environment variables to configure the test
export CONNECTIONS=100
export DURATION=30
export PIPELINING=1
export WORKERS=1
export API_URL=http://localhost:3000

# Run the test
npx ts-node --esm src/load-testing/account-creation.ts
```

### 2. Multiple Tests

Run a series of tests with different configurations:

```bash
npx ts-node --esm src/load-testing/run-tests.ts
```

This will run tests with the following configurations:
- Baseline: 10 connections, 1 pipelining, 1 worker
- Medium load: 50 connections, 1 pipelining, 1 worker
- High load: 100 connections, 1 pipelining, 1 worker
- Pipelined: 100 connections, 10 pipelining, 1 worker
- Multi-worker: 100 connections, 1 pipelining, 4 workers
- Max throughput: 200 connections, 10 pipelining, 4 workers

### 3. Analyze Results

After running the tests, analyze the results:

```bash
npx ts-node --esm src/load-testing/analyze-results.ts
```

This will generate a comprehensive report with:
- Summary of all test results
- Theoretical throughput limits
- Recommendations for production use

## Configuration Options

You can customize the tests using environment variables:

- `API_URL`: The base URL of your API (default: http://localhost:3000)
- `CONNECTIONS`: Number of concurrent connections (default: 100)
- `DURATION`: Test duration in seconds (default: 30)
- `PIPELINING`: Number of pipelined requests per connection (default: 1)
- `WORKERS`: Number of worker threads (default: 1)

## Understanding the Results

The load tests measure:

1. **Requests per second**: The number of account creation requests processed per second
2. **Latency**: Response time statistics (average, p99, etc.)
3. **Success rate**: Percentage of successful requests (2xx responses)
4. **Errors**: Count of failed requests and error types

## DynamoDB Considerations

When interpreting the results, keep in mind:

- **On-demand capacity**: DynamoDB on-demand capacity mode can handle up to thousands of requests per second
- **Provisioned capacity**: For predictable workloads, provisioned capacity may be more cost-effective
- **Throttling**: If you see many 4xx errors, DynamoDB might be throttling your requests
- **Burst capacity**: DynamoDB provides some burst capacity for temporary spikes

## Best Practices

- Run tests multiple times to get consistent results
- Start with lower concurrency and gradually increase
- Monitor DynamoDB metrics during testing (if using AWS)
- Consider testing with different DynamoDB capacity modes
- For production, implement proper error handling and retry logic 