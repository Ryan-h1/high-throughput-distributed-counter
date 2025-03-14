# Dockerfile for setting up the API

FROM node:23-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Set environment variable
ENV NODE_ENV=production

# Start application
CMD ["node", "dist/api/server.js"]