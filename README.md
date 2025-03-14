## Requirements
- [Node.js](https://nodejs.org) (v23)
- [Docker](https://www.docker.com)

## Installation
After cloning the repo (Here's an example using https)

```sh
git clone https://github.com/Ryan-h1/high-throughput-distributed-counter/graphs/commit-activity
```
Navigate into the project file
```sh
cd high-throughput-distributed-counter
```
And install all dependencies

```sh
npm install
```

## Usage

### Start Development Environment
This will spin up the API and a DynamoDB container and then initialize its tables:

```sh
npm run start:dev
```

### Running Tests

```sh
npm run test
```

### Linting & Formatting
*Note that lint:fix and format are automatically run before commits*

```sh
npm run lint        # Check linting issues
npm run lint:fix    # Fix linting issues
npm run format      # Format code with prettier
```