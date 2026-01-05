import { Container } from '@azure/cosmos';
import { getScoreboardsContainer, getScoreboardMembersContainer } from './cosmos.js';
import { Scoreboard, ScoreboardMember } from './models.js';
import { getScoresContainer } from './cosmos.js';
import { Score } from './models.js';

export async function createScoreboard(
  name: string,
  slug: string,
  ownerId: string
): Promise<Scoreboard> {
  const container = await getScoreboardsContainer();
  
  // Check if slug already exists
  try {
    const existing = await container.item(slug, slug).read<Scoreboard>();
    if (existing.resource) {
      throw new Error('Scoreboard with this slug already exists');
    }
  } catch (error: any) {
    if (error.code !== 404) {
      throw error;
    }
  }
  
  // Generate invite code
  const inviteCode = generateInviteCode();
  
  const now = new Date().toISOString();
  
  const scoreboard: Scoreboard = {
    id: slug,
    slug,
    name,
    isGlobal: false,
    ownerId,
    memberIds: [ownerId], // Owner is automatically a member
    inviteCode,
    createdAt: now,
  };
  
  const { resource } = await container.items.create(scoreboard);
  
  // Create membership record
  await addScoreboardMember(resource!.id, ownerId);
  
  return resource!;
}

export async function getScoreboard(slug: string | null): Promise<Scoreboard | null> {
  const container = await getScoreboardsContainer();
  
  if (slug === null || slug === 'global') {
    // Global scoreboard - return a virtual scoreboard
    return {
      id: 'global',
      slug: null,
      name: 'Global Leaderboard',
      isGlobal: true,
      ownerId: 'system',
      memberIds: [], // All users for global
      inviteCode: '',
      createdAt: new Date().toISOString(),
    };
  }
  
  try {
    const { resource } = await container.item(slug, slug).read<Scoreboard>();
    return resource || null;
  } catch (error: any) {
    if (error.code === 404) {
      return null;
    }
    throw error;
  }
}

export async function joinScoreboard(scoreboardId: string, userId: string, inviteCode: string): Promise<boolean> {
  const container = await getScoreboardsContainer();
  
  try {
    // Get scoreboard to verify invite code
    const { resource: scoreboard } = await container.item(scoreboardId, scoreboardId).read<Scoreboard>();
    
    if (!scoreboard) {
      return false;
    }
    
    if (scoreboard.inviteCode !== inviteCode) {
      return false;
    }
    
    // Add user to memberIds if not already present
    if (!scoreboard.memberIds.includes(userId)) {
      scoreboard.memberIds.push(userId);
      await container.items.upsert(scoreboard);
    }
    
    // Create membership record
    await addScoreboardMember(scoreboardId, userId);
    
    return true;
  } catch (error) {
    return false;
  }
}

async function addScoreboardMember(scoreboardId: string, userId: string): Promise<void> {
  const container = await getScoreboardMembersContainer();
  
  const memberId = `${scoreboardId}:${userId}`;
  const now = new Date().toISOString();
  
  const member: ScoreboardMember = {
    id: memberId,
    scoreboardId,
    userId,
    joinedAt: now,
  };
  
  await container.items.upsert(member);
}

export async function getUserScoreboards(userId: string): Promise<Scoreboard[]> {
  const membersContainer = await getScoreboardMembersContainer();
  const scoreboardsContainer = await getScoreboardsContainer();
  
  // Get all memberships for this user
  const { resources: memberships } = await membersContainer.items
    .query({
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: userId }],
    })
    .fetchAll();
  
  // Get all scoreboards
  const scoreboards: Scoreboard[] = [];
  
  for (const membership of memberships) {
    try {
      const { resource } = await scoreboardsContainer
        .item(membership.scoreboardId, membership.scoreboardId)
        .read<Scoreboard>();
      
      if (resource) {
        scoreboards.push(resource);
      }
    } catch (error) {
      // Skip if scoreboard not found
      continue;
    }
  }
  
  return scoreboards;
}

export async function getScoreboardScores(
  scoreboardId: string,
  gameType: string,
  memberIds: string[] | null, // null means all users (global)
  gameDate?: string // Optional date filter (YYYY-MM-DD format)
): Promise<Score[]> {
  const container = await getScoresContainer();
  
  let query: string;
  let parameters: { name: string; value: unknown }[];
  
  if (memberIds === null) {
    // Global scoreboard - get all scores for this game type
    if (gameDate) {
      query = 'SELECT * FROM c WHERE c.gameType = @gameType AND c.gameDate = @gameDate';
      parameters = [
        { name: '@gameType', value: gameType },
        { name: '@gameDate', value: gameDate },
      ];
    } else {
      query = 'SELECT * FROM c WHERE c.gameType = @gameType';
      parameters = [{ name: '@gameType', value: gameType }];
    }
  } else {
    // Private scoreboard - get scores for members only
    if (gameDate) {
      query = 'SELECT * FROM c WHERE c.gameType = @gameType AND c.gameDate = @gameDate AND ARRAY_CONTAINS(@memberIds, c.userId)';
      parameters = [
        { name: '@gameType', value: gameType },
        { name: '@gameDate', value: gameDate },
        { name: '@memberIds', value: memberIds },
      ];
    } else {
      query = 'SELECT * FROM c WHERE c.gameType = @gameType AND ARRAY_CONTAINS(@memberIds, c.userId)';
      parameters = [
        { name: '@gameType', value: gameType },
        { name: '@memberIds', value: memberIds },
      ];
    }
  }
  
  const { resources } = await container.items.query({ query, parameters }).fetchAll();
  
  return resources;
}

function generateInviteCode(): string {
  // Generate a random 8-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}