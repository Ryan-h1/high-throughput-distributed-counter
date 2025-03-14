import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dynamoDBClient } from '../../db/config.js';
import {
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import { SERVICES_TABLE, Service } from '../../db/schema.js';

const router = Router();

const dynamoDBDocumentClient = DynamoDBDocumentClient.from(dynamoDBClient);

// Get all services
router.get('/', async (req: Request, res: Response) => {
  try {
    const command = new ScanCommand({
      TableName: SERVICES_TABLE,
    });

    const result = await dynamoDBDocumentClient.send(command);

    res.status(200).json(result.Items);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Could not retrieve services' });
  }
});

// Get services by account ID
router.get('/account/:accountId', async (req: Request, res: Response) => {
  try {
    const command = new ScanCommand({
      TableName: SERVICES_TABLE,
      FilterExpression: 'accountId = :accountId',
      ExpressionAttributeValues: {
        ':accountId': req.params.accountId,
      },
    });

    const result = await dynamoDBDocumentClient.send(command);

    res.status(200).json(result.Items);
  } catch (error) {
    console.error('Error fetching services by account ID:', error);
    res
      .status(500)
      .json({ error: 'Could not retrieve services for this account' });
  }
});

// Get single service
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const command = new GetCommand({
      TableName: SERVICES_TABLE,
      Key: {
        id: req.params.id,
      },
    });

    const result = await dynamoDBDocumentClient.send(command);

    if (!result.Item) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.status(200).json(result.Item);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Could not retrieve service' });
  }
});

// Create service
router.post('/', async (req: Request, res: Response) => {
  const { accountId, name } = req.body;

  if (!accountId || !name) {
    res.status(400).json({ error: 'Account ID and name are required' });
    return;
  }

  const service: Service = {
    id: uuidv4(),
    accountId,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const command = new PutCommand({
      TableName: SERVICES_TABLE,
      Item: service,
    });

    await dynamoDBDocumentClient.send(command);

    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Could not create service' });
  }
});

// Update service
router.put('/:id', async (req: Request, res: Response) => {
  const { name } = req.body;
  const { id } = req.params;

  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  try {
    const command = new UpdateCommand({
      TableName: SERVICES_TABLE,
      Key: { id },
      UpdateExpression: 'SET #name = :name, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':name': name,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    });

    const result = await dynamoDBDocumentClient.send(command);

    if (!result.Attributes) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.status(200).json(result.Attributes);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Could not update service' });
  }
});

// Delete service
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const command = new DeleteCommand({
      TableName: SERVICES_TABLE,
      Key: {
        id: req.params.id,
      },
      ReturnValues: 'ALL_OLD',
    });

    const result = await dynamoDBDocumentClient.send(command);

    if (!result.Attributes) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Could not delete service' });
  }
});

export default router;
