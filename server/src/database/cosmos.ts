import { CosmosClient, Database, Container } from '@azure/cosmos';

// Support for local Cosmos DB Emulator
const endpoint = process.env.COSMOS_DB_ENDPOINT || 'https://localhost:8081/';
const key = process.env.COSMOS_DB_KEY || 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==';

// Local emulator uses a fixed key and doesn't require SSL verification
const isLocalEmulator = endpoint.includes('localhost') || endpoint.includes('127.0.0.1');

const clientOptions: any = {
  endpoint,
  key,
};

// Disable SSL verification for local emulator
if (isLocalEmulator) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('Using local Cosmos DB Emulator (SSL verification disabled)');
}

export const client = new CosmosClient(clientOptions);

export const databaseName = 'scorepaster';
export let database: Database;

export async function initializeDatabase() {
  try {
    const { database: db } = await client.databases.createIfNotExists({ id: databaseName });
    database = db;
    console.log('Cosmos DB database initialized');
    return db;
  } catch (error) {
    console.error('Failed to initialize Cosmos DB database:', error);
    throw error;
  }
}

export async function getContainer(containerName: string): Promise<Container> {
  if (!database) {
    await initializeDatabase();
  }
  
  const { container } = await database.containers.createIfNotExists({
    id: containerName,
    partitionKey: { paths: ['/id'] },
  });
  
  return container;
}

// Container-specific getters with proper partition keys
export async function getUsersContainer(): Promise<Container> {
  if (!database) {
    await initializeDatabase();
  }
  
  const { container } = await database.containers.createIfNotExists({
    id: 'Users',
    partitionKey: { paths: ['/id'] },
  });
  
  return container;
}

export async function getScoresContainer(): Promise<Container> {
  if (!database) {
    await initializeDatabase();
  }
  
  const { container } = await database.containers.createIfNotExists({
    id: 'Scores',
    partitionKey: { paths: ['/userId'] },
  });
  
  return container;
}

export async function getScoreboardsContainer(): Promise<Container> {
  if (!database) {
    await initializeDatabase();
  }
  
  const { container } = await database.containers.createIfNotExists({
    id: 'Scoreboards',
    partitionKey: { paths: ['/id'] }, // Changed from gameType to id (slug-based)
  });
  
  return container;
}

export async function getScoreboardMembersContainer(): Promise<Container> {
  if (!database) {
    await initializeDatabase();
  }
  
  const { container } = await database.containers.createIfNotExists({
    id: 'ScoreboardMembers',
    partitionKey: { paths: ['/userId'] },
  });
  
  return container;
}