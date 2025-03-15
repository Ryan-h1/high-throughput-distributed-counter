#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
API_URL=${API_URL:-"http://localhost:3000"}
DURATION=${DURATION:-30}
CONNECTIONS=${CONNECTIONS:-100}
PIPELINING=${PIPELINING:-1}
WORKERS=${WORKERS:-1}
MODE=${1:-"single"} # Default to single test if no argument provided

# Create results directory if it doesn't exist
mkdir -p load-test-results

echo -e "${YELLOW}DynamoDB Load Testing Tool${NC}"
echo "========================================"
echo -e "API URL: ${GREEN}$API_URL${NC}"
echo -e "Mode: ${GREEN}$MODE${NC}"

# Function to run a single test
run_single_test() {
  echo -e "\n${YELLOW}Running single load test with:${NC}"
  echo "Connections: $CONNECTIONS"
  echo "Duration: $DURATION seconds"
  echo "Pipelining: $PIPELINING"
  echo "Workers: $WORKERS"
  echo "========================================"
  
  # Export environment variables
  export API_URL=$API_URL
  export DURATION=$DURATION
  export CONNECTIONS=$CONNECTIONS
  export PIPELINING=$PIPELINING
  export WORKERS=$WORKERS
  
  # Run the test
  npm run load-test
}

# Function to run batch tests
run_batch_tests() {
  echo -e "\n${YELLOW}Running batch load tests with multiple configurations${NC}"
  echo "This will run 6 different test configurations"
  echo "========================================"
  
  # Export API URL
  export API_URL=$API_URL
  
  # Run the tests
  npm run load-test:batch
}

# Function to analyze results
analyze_results() {
  echo -e "\n${YELLOW}Analyzing load test results${NC}"
  echo "========================================"
  
  # Run the analysis
  npm run load-test:analyze
}

# Main execution
case $MODE in
  "single")
    run_single_test
    analyze_results
    ;;
  "batch")
    run_batch_tests
    analyze_results
    ;;
  "analyze")
    analyze_results
    ;;
  *)
    echo -e "${RED}Invalid mode: $MODE${NC}"
    echo "Usage: ./run-load-test.sh [single|batch|analyze]"
    exit 1
    ;;
esac

echo -e "\n${GREEN}Load testing completed!${NC}"
echo "Check the load-test-results directory for detailed results." 