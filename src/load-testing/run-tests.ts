import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configurations
const testConfigurations = [
  {
    connections: 10,
    duration: 30,
    pipelining: 1,
    workers: 1,
    name: 'baseline',
  },
  {
    connections: 50,
    duration: 30,
    pipelining: 1,
    workers: 1,
    name: 'medium-load',
  },
  {
    connections: 100,
    duration: 30,
    pipelining: 1,
    workers: 1,
    name: 'high-load',
  },
  {
    connections: 100,
    duration: 30,
    pipelining: 10,
    workers: 1,
    name: 'pipelined',
  },
  {
    connections: 100,
    duration: 30,
    pipelining: 1,
    workers: 4,
    name: 'multi-worker',
  },
  {
    connections: 200,
    duration: 30,
    pipelining: 10,
    workers: 4,
    name: 'max-throughput',
  },
];

// Create results directory if it doesn't exist
const resultsDir = path.join(process.cwd(), 'load-test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

// Function to run a single test configuration
async function runTest(config: (typeof testConfigurations)[0]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('\n========================================');
    console.log(`Running test: ${config.name}`);
    console.log(
      `Connections: ${config.connections}, Duration: ${config.duration}s`,
    );
    console.log(`Pipelining: ${config.pipelining}, Workers: ${config.workers}`);
    console.log('========================================\n');

    // Set environment variables for the test
    const env = {
      ...process.env,
      CONNECTIONS: config.connections.toString(),
      DURATION: config.duration.toString(),
      PIPELINING: config.pipelining.toString(),
      WORKERS: config.workers.toString(),
    };

    // Run the test script
    const testProcess = spawn(
      'node',
      ['--loader', 'ts-node/esm', path.join(__dirname, 'account-creation.ts')],
      {
        env,
        stdio: 'inherit',
      },
    );

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`\nTest "${config.name}" completed successfully`);
        resolve();
      } else {
        console.error(`\nTest "${config.name}" failed with code ${code}`);
        reject(new Error(`Test failed with code ${code}`));
      }
    });
  });
}

// Run all tests sequentially
async function runAllTests(): Promise<void> {
  console.log('Starting load test suite');

  for (const config of testConfigurations) {
    try {
      await runTest(config);
    } catch (error) {
      console.error(`Error running test "${config.name}":`, error);
    }
  }

  console.log('\nAll tests completed');
}

// Run the tests
runAllTests().catch(console.error);
