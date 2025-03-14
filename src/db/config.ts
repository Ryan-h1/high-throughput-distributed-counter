import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// Initialize DynamoDB client
export const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'local',
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
  },
});

export default dynamoDBClient;
