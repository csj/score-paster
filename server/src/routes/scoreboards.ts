import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getScoreboard,
  createScoreboard,
  joinScoreboard,
  getUserScoreboards,
  getScoreboardScores,
} from '../database/scoreboards.js';
import { trackEvent, logInfo, logError } from '../utils/appinsights.js';

const router = Router();

// Get scores for a specific board and game
// GET /api/scoreboards/global/scores/wordle
// GET /api/scoreboards/my-private/scores/wordle
router.get('/:boardSlug/scores/:gameType', async (req: Request, res: Response) => {
  try {
    const { boardSlug, gameType } = req.params;
    
    const scoreboard = await getScoreboard(boardSlug === 'global' ? null : boardSlug);
    
    if (!scoreboard) {
      return res.status(404).json({ error: 'Scoreboard not found' });
    }
    
    // Get scores for this scoreboard and game type
    const memberIds = scoreboard.isGlobal ? null : scoreboard.memberIds;
    const scores = await getScoreboardScores(scoreboard.id, gameType, memberIds);
    
    // Rank scores by game date and score value
    // For Wordle: lower guesses = better
    // For Connections: lower mistakes = better
    const rankedScores = scores.sort((a, b) => {
      // First sort by game date (most recent first)
      if (a.gameDate !== b.gameDate) {
        return b.gameDate.localeCompare(a.gameDate);
      }
      
      // Then sort by score (game-specific)
      const aData = a.scoreData as any;
      const bData = b.scoreData as any;
      
      if (a.gameType === 'wordle') {
        // Lower guesses = better
        return (aData.guesses || 999) - (bData.guesses || 999);
      } else if (a.gameType === 'connections') {
        // Lower mistakes = better
        return (aData.mistakes || 999) - (bData.mistakes || 999);
      }
      
      return 0;
    });
    
    res.json({
      scoreboard,
      gameType,
      scores: rankedScores,
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
    logError(error as Error, { userId: req.user?.id, endpoint: '/api/scoreboards' });
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
    logError(error as Error, { userId: req.user?.id, endpoint: '/api/scoreboards/:slug/join' });
    res.status(500).json({ error: 'Failed to join scoreboard' });
  }
});

// Get all scoreboards user is member of
// GET /api/scoreboards/my-boards
router.get('/my-boards', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const scoreboards = await getUserScoreboards(req.user.id);
    
    res.json(scoreboards);
  } catch (error) {
    logError(error as Error, { userId: req.user?.id, endpoint: '/api/scoreboards/my-boards' });
    res.status(500).json({ error: 'Failed to get user scoreboards' });
  }
});

export default router;