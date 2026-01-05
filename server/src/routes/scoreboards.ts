import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { verifyToken, getCompositeUserId } from '../utils/jwt.js';
import { getUserById } from '../database/users.js';
import {
  getScoreboard,
  createScoreboard,
  joinScoreboard,
  getUserScoreboards,
  getScoreboardScores,
} from '../database/scoreboards.js';
import { getUsersByIds } from '../database/users.js';
import { compareScores } from '../utils/scoreRanking.js';
import { trackEvent, logInfo, logError } from '../utils/appinsights.js';

const router = Router();

// Get all scoreboards user is member of
// GET /api/scoreboards/my-boards
// IMPORTANT: This must come BEFORE /:boardSlug routes to avoid route conflicts
router.get('/my-boards', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const scoreboards = await getUserScoreboards(req.user.id);

    res.json(scoreboards);
  } catch (error) {
    logError(error as Error, { userId: req.user?.id || 'unknown', endpoint: '/api/scoreboards/my-boards' });
    res.status(500).json({ error: 'Failed to get user scoreboards' });
  }
});

// Get scores for a specific board and game
// GET /api/scoreboards/global/scores/wordle?date=2024-01-15 (optional date filter, defaults to today)
// GET /api/scoreboards/my-private/scores/wordle
router.get('/:boardSlug/scores/:gameType', async (req: Request, res: Response) => {
  try {
    const { boardSlug, gameType } = req.params;
    const { date } = req.query;
    
    // Default to today's date if not specified
    let gameDate: string | undefined;
    if (date && typeof date === 'string') {
      // Validate date format (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        gameDate = date;
      }
    } else {
      // Default to today
      gameDate = new Date().toISOString().split('T')[0];
    }
    
    // Try to get current user ID from auth header (if present)
    let currentUserId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const claims = await verifyToken(token);
        const userId = getCompositeUserId(claims);
        const user = await getUserById(userId);
        if (user) {
          currentUserId = user.id;
        }
      } catch {
        // Invalid token, ignore - continue without prioritizing user
      }
    }
    
    const scoreboard = await getScoreboard(boardSlug === 'global' ? null : boardSlug);
    
    if (!scoreboard) {
      return res.status(404).json({ error: 'Scoreboard not found' });
    }
    
    // Get scores for this scoreboard and game type
    const memberIds = scoreboard.isGlobal ? null : scoreboard.memberIds;
    const scores = await getScoreboardScores(scoreboard.id, gameType, memberIds, gameDate);
    
    // Rank scores using standardized comparison function
    // Handles both "lower is better" (Wordle, Connections) and "higher is better" (score-based games)
    // If user is authenticated, prioritize their score when scores are equal
    const rankedScores = scores.sort((a, b) => compareScores(a, b, currentUserId));
    
    // Get unique user IDs from scores
    const userIds = [...new Set(rankedScores.map(s => s.userId))];
    
    // Fetch user info for all users in the leaderboard
    const users = await getUsersByIds(userIds);
    const userMap = new Map(users.map(u => [u.id, u]));
    
    // Attach user info to scores
    const scoresWithUsers = rankedScores.map(score => ({
      ...score,
      user: userMap.get(score.userId) ? {
        id: userMap.get(score.userId)!.id,
        username: userMap.get(score.userId)!.username || userMap.get(score.userId)!.displayName,
        displayName: userMap.get(score.userId)!.displayName,
        avatarUrl: userMap.get(score.userId)!.avatarUrl,
      } : null,
    }));
    
    res.json({
      scoreboard,
      gameType,
      gameDate: gameDate, // Include the date that was queried
      scores: scoresWithUsers,
    });
  } catch (error) {
    logError(error as Error, { endpoint: '/api/scoreboards/:boardSlug/scores/:gameType' });
    res.status(500).json({ error: 'Failed to get scores' });
  }
});

// Get scoreboard info (without scores)
// GET /api/scoreboards/global
// GET /api/scoreboards/my-private
router.get('/:boardSlug', async (req: Request, res: Response) => {
  try {
    const { boardSlug } = req.params;
    
    const scoreboard = await getScoreboard(boardSlug === 'global' ? null : boardSlug);
    
    if (!scoreboard) {
      return res.status(404).json({ error: 'Scoreboard not found' });
    }
    
    res.json(scoreboard);
  } catch (error) {
    logError(error as Error, { endpoint: '/api/scoreboards/:boardSlug' });
    res.status(500).json({ error: 'Failed to get scoreboard' });
  }
});

// Create new private scoreboard
// POST /api/scoreboards
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { name, slug } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: 'name and slug are required' });
    }
    
    // Validate slug format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ error: 'Slug must be lowercase alphanumeric with hyphens only' });
    }
    
    // Check if scoreboard already exists
    const existing = await getScoreboard(slug);
    if (existing) {
      return res.status(409).json({ error: 'Scoreboard with this slug already exists' });
    }
    
    const scoreboard = await createScoreboard(name, slug, req.user.id);
    
    trackEvent('scoreboard_created', {
      userId: req.user.id,
      scoreboardId: scoreboard.id,
    });
    logInfo('Scoreboard created', { userId: req.user.id, scoreboardId: scoreboard.id });
    
    res.json(scoreboard);
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
        logError(error as Error, { userId: req.user?.id || 'unknown', endpoint: '/api/scoreboards' });
    res.status(500).json({ error: 'Failed to create scoreboard' });
  }
});

// Join scoreboard via invite code
// GET /api/scoreboards/{slug}/join?code=ABC123
router.get('/:slug/join', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { slug } = req.params;
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Invite code is required' });
    }
    
    const scoreboard = await getScoreboard(slug);
    if (!scoreboard) {
      return res.status(404).json({ error: 'Scoreboard not found' });
    }
    
    const success = await joinScoreboard(scoreboard.id, req.user.id, code);
    
    if (!success) {
      return res.status(400).json({ error: 'Invalid invite code' });
    }
    
    trackEvent('user_joined_scoreboard', {
      userId: req.user.id,
      scoreboardId: scoreboard.id,
    });
    logInfo('User joined scoreboard', { userId: req.user.id, scoreboardId: scoreboard.id });
    
    res.json({ success: true, scoreboard });
  } catch (error) {
        logError(error as Error, { userId: req.user?.id || 'unknown', endpoint: '/api/scoreboards/:slug/join' });
    res.status(500).json({ error: 'Failed to join scoreboard' });
  }
});

export default router;