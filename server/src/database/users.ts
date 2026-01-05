import { getUsersContainer } from './cosmos.js';
import { User, Provider } from './models.js';

export async function createOrUpdateUser(
  provider: Provider,
  providerUserId: string,
  email: string,
  displayName: string,
  avatarUrl?: string
): Promise<User> {
  const container = await getUsersContainer();
  const compositeId = `${provider}:${providerUserId}`;
  
  const now = new Date().toISOString();
  
  // Try to get existing user
  try {
    const { resource: existing } = await container.item(compositeId, compositeId).read<User>();
    
    if (existing) {
      // Update existing user (preserve username if set, otherwise use displayName)
      const updated: User = {
        ...existing,
        email,
        displayName,
        avatarUrl,
        username: existing.username || displayName, // Keep existing username or default to displayName
        lastLoginAt: now,
      };
      
      const { resource } = await container.items.upsert(updated);
      return resource as unknown as User;
    }
  } catch (error: any) {
    // User doesn't exist, create new one
    if (error.code !== 404) {
      throw error;
    }
  }
  
  // Create new user (username defaults to displayName)
  const newUser: User = {
    id: compositeId,
    provider,
    providerUserId,
    email,
    displayName,
    username: displayName, // Default to displayName
    avatarUrl,
    createdAt: now,
    lastLoginAt: now,
  };
  
  const { resource } = await container.items.create(newUser);
  return resource as unknown as User;
}

export async function getUserById(userId: string): Promise<User | null> {
  const container = await getUsersContainer();
  
  try {
    const { resource } = await container.item(userId, userId).read<User>();
    return resource || null;
  } catch (error: any) {
    if (error.code === 404) {
      return null;
    }
    throw error;
  }
}

export async function updateUsername(userId: string, username: string): Promise<User> {
  const container = await getUsersContainer();
  
  const { resource: user } = await container.item(userId, userId).read<User>();
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const updated: User = {
    ...user,
    username,
  };
  
  const { resource } = await container.items.upsert(updated);
  return resource as unknown as User;
}

export async function getUsersByIds(userIds: string[]): Promise<User[]> {
  const container = await getUsersContainer();
  const users: User[] = [];
  
  // Cosmos DB doesn't support IN queries efficiently, so fetch individually
  // For better performance with many users, consider batching or using a different approach
  for (const userId of userIds) {
    try {
      const { resource } = await container.item(userId, userId).read<User>();
      if (resource) {
        users.push(resource);
      }
    } catch (error: any) {
      // Skip if user not found
      if (error.code !== 404) {
        throw error;
      }
    }
  }
  
  return users;
}