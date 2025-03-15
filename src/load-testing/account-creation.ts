import autocannon, { Instance, Options, Result, Client } from 'autocannon';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const ACCOUNTS_ENDPOINT = `${API_URL}/api/accounts`;
const DURATION_SECONDS = parseInt(process.env.DURATION || '30', 10);
const CONNECTIONS = parseInt(process.env.CONNECTIONS || '100', 10);
const PIPELINING = parseInt(process.env.PIPELINING || '1', 10);
const WORKERS = parseInt(process.env.WORKERS || '1', 10);

// Generate a unique username for each request
function generateUsername(): string {
  return `user_${randomBytes(8).toString('hex')}`;
}

// Create results directory if it doesn't exist
const resultsDir = path.join(process.cwd(), 'load-test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

// Run a single autocannon instance
async function runSingleTest(): Promise<Result> {
  // Create options based on pipelining value
  let options: Options;

  if (PIPELINING > 1) {
    // When pipelining > 1, we can't use setupClient with setBody
    options = {
      url: ACCOUNTS_ENDPOINT,
      connections: CONNECTIONS,
      duration: DURATION_SECONDS,
      pipelining: PIPELINING,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Use a fixed body with a random username
      // This is a limitation when using pipelining > 1
      body: JSON.stringify({
        username: `batch_user_${randomBytes(8).toString('hex')}`,
      }),
    };
  } else {
    // When pipelining = 1, we can use setupClient for truly unique usernames per request
    options = {
      url: ACCOUNTS_ENDPOINT,
      connections: CONNECTIONS,
      duration: DURATION_SECONDS,
      pipelining: PIPELINING,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      setupClient: (client: Client) => {
        // For each request, generate a unique username
        client.setBody(JSON.stringify({ username: generateUsername() }));
      },
    };
  }

  // Run autocannon without workers option
  const instance = autocannon(options) as unknown as Instance;

  // Print progress to console
  autocannon.track(instance, { renderProgressBar: true });

  // Return a promise that resolves with the results
  return new Promise((resolve, reject) => {
    instance.on('done', resolve);
    instance.on('error', reject);
  });
}

// Combine results from multiple tests
function combineResults(results: Result[]): Result {
  if (results.length === 0) {
    throw new Error('No results to combine');
  }

  if (results.length === 1) {
    return results[0];
  }

  // Create a copy of the first result
  const combined = JSON.parse(JSON.stringify(results[0])) as Result;

  // Sum up all the values from each test
  let totalRequests = combined.requests.average;
  let totalLatency = combined.latency.average * combined.requests.average;
  let totalThroughput = combined.throughput.average;
  let totalWeight = combined.requests.average;

  // Combine numeric properties
  for (let i = 1; i < results.length; i++) {
    const result = results[i];

    // Sum up request counts
    combined.requests.total += result.requests.total;
    combined.requests.sent += result.requests.sent;

    // Sum up status codes
    combined['1xx'] += result['1xx'];
    combined['2xx'] += result['2xx'];
    combined['3xx'] += result['3xx'];
    combined['4xx'] += result['4xx'];
    combined['5xx'] += result['5xx'];
    combined.non2xx += result.non2xx;

    // Sum up errors
    combined.errors += result.errors;
    combined.timeouts += result.timeouts;
    combined.mismatches += result.mismatches;
    combined.resets += result.resets;

    // Sum up throughput
    combined.throughput.total += result.throughput.total;

    // Weighted average for these fields
    totalRequests += result.requests.average;
    totalLatency += result.latency.average * result.requests.average;
    totalThroughput += result.throughput.average;
    totalWeight += result.requests.average;

    // Take the max of max values
    combined.latency.max = Math.max(combined.latency.max, result.latency.max);
    combined.requests.max = Math.max(
      combined.requests.max,
      result.requests.max,
    );
    combined.throughput.max = Math.max(
      combined.throughput.max,
      result.throughput.max,
    );

    // Take the min of min values
    combined.latency.min = Math.min(combined.latency.min, result.latency.min);
    combined.requests.min = Math.min(
      combined.requests.min,
      result.requests.min,
    );
    combined.throughput.min = Math.min(
      combined.throughput.min,
      result.throughput.min,
    );
  }

  // Calculate weighted averages
  combined.requests.average = totalRequests;
  combined.latency.average = totalLatency / totalWeight;
  combined.throughput.average = totalThroughput;

  return combined;
}

// Run the load test
async function runLoadTest(): Promise<void> {
  console.log(
    `Starting load test with ${CONNECTIONS} connections for ${DURATION_SECONDS} seconds`,
  );
  console.log(`API URL: ${ACCOUNTS_ENDPOINT}`);
  console.log(
    `Pipelining: ${PIPELINING}, Running with ${WORKERS} parallel test(s)`,
  );

  try {
    let results: Result;

    if (WORKERS > 1) {
      console.log(`Spawning ${WORKERS} parallel tests...`);

      // Run multiple tests in parallel
      const testPromises: Promise<Result>[] = [];
      for (let i = 0; i < WORKERS; i++) {
        testPromises.push(runSingleTest());
      }

      // Wait for all tests to complete
      const allResults = await Promise.all(testPromises);

      // Combine results
      results = combineResults(allResults);
    } else {
      // Just run a single test
      results = await runSingleTest();
    }

    // Handle the results
    handleResults(results);
  } catch (error) {
    console.error('Error running load test:', error);
    throw error;
  }
}

// Handle and save test results
function handleResults(results: Result): void {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filePath = path.join(resultsDir, `account-creation-${timestamp}.json`);

  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${filePath}`);

  // Print summary
  console.log('\nSummary:');
  console.log(`Requests per second: ${results.requests.average}`);
  console.log(`Latency (avg): ${results.latency.average} ms`);
  console.log(`Latency (max): ${results.latency.max} ms`);
  console.log(
    `Throughput: ${(results.throughput.average / 1024 / 1024).toFixed(2)} MB/s`,
  );
  console.log(`2xx responses: ${results['2xx']}`);
  console.log(`Non-2xx responses: ${results.non2xx}`);
}

// Run the test
runLoadTest().catch(console.error);
