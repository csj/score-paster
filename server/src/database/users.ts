import { Container } from '@azure/cosmos';
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
      // Update existing user
      const updated: User = {
        ...existing,
        email,
        displayName,
        avatarUrl,
        lastLoginAt: now,
      };
      
      const { resource } = await container.items.upsert(updated);
      return resource!;
    }
  } catch (error: any) {
    // User doesn't exist, create new one
    if (error.code !== 404) {
      throw error;
    }
  }
  
  // Create new user
  const newUser: User = {
    id: compositeId,
    provider,
    providerUserId,
    email,
    displayName,
    avatarUrl,
    createdAt: now,
    lastLoginAt: now,
  };
  
  const { resource } = await container.items.create(newUser);
  return resource!;
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