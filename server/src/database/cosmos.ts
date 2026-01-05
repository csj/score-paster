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
    // Check if database exists first
    try {
      const { database: existingDb } = await client.database(databaseName).read();
      database = existingDb;
      console.log('Cosmos DB database already exists, using existing database');
      return existingDb;
    } catch (error: any) {
      // Database doesn't exist (404), create it
      if (error.code === 404) {
        const { database: db } = await client.databases.create({ id: databaseName });
        database = db;
        console.log('Cosmos DB database created');
        return db;
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to initialize Cosmos DB database:', error);
    throw error;
  }
}

export async function getContainer(containerName: string): Promise<Container> {
  if (!database) {
    await initializeDatabase();
  }
  
  // Check if container exists first
  try {
    const { container } = await database.container(containerName).read();
    return container;
  } catch (error: any) {
    // Container doesn't exist (404), create it
    if (error.code === 404) {
      const { container } = await database.containers.create({
        id: containerName,
        partitionKey: { paths: ['/id'] },
      });
      return container;
    }
    throw error;
  }
}

// Container-specific getters with proper partition keys
export async function getUsersContainer(): Promise<Container> {
  if (!database) {
    await initializeDatabase();
  }
  
  // Check if container exists first
  try {
    const { container } = await database.container('Users').read();
    return container;
  } catch (error: any) {
    // Container doesn't exist (404), create it
    if (error.code === 404) {
      const { container } = await database.containers.create({
        id: 'Users',
        partitionKey: { paths: ['/id'] },
      });
      return container;
    }
    throw error;
  }
}

export async function getScoresContainer(): Promise<Container> {
  if (!database) {
    await initializeDatabase();
  }
  
  // Check if container exists first
  try {
    const { container } = await database.container('Scores').read();
    return container;
  } catch (error: any) {
    // Container doesn't exist (404), create it
    if (error.code === 404) {
      const { container } = await database.containers.create({
        id: 'Scores',
        partitionKey: { paths: ['/userId'] },
      });
      return container;
    }
    throw error;
  }
}

export async function getScoreboardsContainer(): Promise<Container> {
  if (!database) {
    await initializeDatabase();
  }
  
  // Check if container exists first
  try {
    const { container } = await database.container('Scoreboards').read();
    return container;
  } catch (error: any) {
    // Container doesn't exist (404), create it
    if (error.code === 404) {
      const { container } = await database.containers.create({
        id: 'Scoreboards',
        partitionKey: { paths: ['/id'] }, // Changed from gameType to id (slug-based)
      });
      return container;
    }
    throw error;
  }
}

export async function getScoreboardMembersContainer(): Promise<Container> {
  if (!database) {
    await initializeDatabase();
  }
  
  // Check if container exists first
  try {
    const { container } = await database.container('ScoreboardMembers').read();
    return container;
  } catch (error: any) {
    // Container doesn't exist (404), create it
    if (error.code === 404) {
      const { container } = await database.containers.create({
        id: 'ScoreboardMembers',
        partitionKey: { paths: ['/userId'] },
      });
      return container;
    }
    throw error;
  }
}