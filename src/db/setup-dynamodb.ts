import { CreateTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { TABLES } from './schema';
import dynamoDBClient from './config';

// Function to create all tables
const createTables = async (dynamoDBClient: DynamoDBClient): Promise<void> => {
  for (const tableDefinition of TABLES) {
    try {
      console.log(`Creating table: ${tableDefinition.TableName}`);
      const command = new CreateTableCommand(tableDefinition);
      const response = await dynamoDBClient.send(command);
      console.log(
        'Table created successfully:',
        response.TableDescription?.TableName,
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ResourceInUseException') {
        console.log(`Table already exists: ${tableDefinition.TableName}`);
      } else {
        console.error(
          `Error creating table ${tableDefinition.TableName}:`,
          error,
        );
      }
    }
  }
};

// Run the table creation
createTables(dynamoDBClient)
  .then(() => console.log('All tables created or already exist'))
  .catch((err) => console.error('Error in table creation process:', err));
