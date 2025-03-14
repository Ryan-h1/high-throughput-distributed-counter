import { CreateTableCommandInput } from '@aws-sdk/client-dynamodb';

// Table name constants
export const ACCOUNTS_TABLE = 'Accounts';

// Schema interfaces
export interface Account {
  id: string;
  username: string;
  createdAt: string;
  updatedAt?: string;
}

export const TABLES: CreateTableCommandInput[] = [
  {
    TableName: ACCOUNTS_TABLE,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
];
