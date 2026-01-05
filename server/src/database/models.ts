export type Provider = 'google' | 'facebook' | 'microsoft';

export interface User {
  id: string; // Composite: {provider}:{providerUserId}
  provider: Provider;
  providerUserId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface Score {
  id: string;
  userId: string; // Composite user ID
  gameType: string;
  gameDate: string; // YYYY-MM-DD
  scoreData: Record<string, unknown>;
  rawPaste: string;
  createdAt: string;
  ttl?: number;
}

export interface Scoreboard {
  id: string; // slug for private boards, "global" for global board
  slug: string | null; // null for global, unique string for private boards
  name: string;
  isGlobal: boolean;
  ownerId: string; // Composite user ID (empty for global)
  memberIds: string[]; // Array of composite user IDs
  inviteCode: string;
  createdAt: string;
}

export interface ScoreboardMember {
  id: string; // Composite: {scoreboardId}:{userId}
  scoreboardId: string;
  userId: string; // Composite user ID
  joinedAt: string;
}