import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDBClient } from '../../db/config';
import { ACCOUNTS_TABLE, Account } from '../../db/schema';

const router = Router();

const dynamoDBDocumentClient = DynamoDBDocumentClient.from(dynamoDBClient);

// Get all accounts
router.get('/', async (req: Request, res: Response) => {
  try {
    const command = new ScanCommand({
      TableName: ACCOUNTS_TABLE,
    });

    const result = await dynamoDBDocumentClient.send(command);

    res.status(200).json(result.Items);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Could not retrieve accounts' });
  }
});

// Get single account
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const command = new GetCommand({
      TableName: ACCOUNTS_TABLE,
      Key: {
        id: req.params.id,
      },
    });

    const result = await dynamoDBDocumentClient.send(command);

    if (!result.Item) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    res.status(200).json(result.Item);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Could not retrieve account' });
  }
});

// Create account
router.post('/', async (req: Request, res: Response) => {
  const { username } = req.body;

  if (!username) {
    res.status(400).json({ error: 'Username is required' });
    return;
  }

  const account: Account = {
    id: uuidv4(),
    username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const command = new PutCommand({
      TableName: ACCOUNTS_TABLE,
      Item: account,
    });

    await dynamoDBDocumentClient.send(command);

    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Could not create account' });
  }
});

// Update account
router.put('/:id', async (req: Request, res: Response) => {
  const { username } = req.body;
  const { id } = req.params;

  if (!username) {
    res.status(400).json({ error: 'Username is required' });
    return;
  }

  try {
    // Build update expression
    const command = new UpdateCommand({
      TableName: ACCOUNTS_TABLE,
      Key: { id },
      UpdateExpression: 'SET #username = :username, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#username': 'username',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':username': username,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    });

    const result = await dynamoDBDocumentClient.send(command);

    if (!result.Attributes) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    res.status(200).json(result.Attributes);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Could not update account' });
  }
});

// Delete account
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const command = new DeleteCommand({
      TableName: ACCOUNTS_TABLE,
      Key: {
        id: req.params.id,
      },
      ReturnValues: 'ALL_OLD',
    });

    const result = await dynamoDBDocumentClient.send(command);

    if (!result.Attributes) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Could not delete account' });
  }
});

export default router;
