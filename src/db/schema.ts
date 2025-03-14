import { CreateTableCommandInput } from '@aws-sdk/client-dynamodb';

// Table name constants
export const ACCOUNTS_TABLE = 'Accounts';
export const SERVICES_TABLE = 'Services';
// Schema interfaces
export interface Account {
  id: string;
  username: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Service {
  id: string;
  accountId: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
}

export const TABLES: CreateTableCommandInput[] = [
  {
    TableName: ACCOUNTS_TABLE,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: SERVICES_TABLE,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST',
  },
];
