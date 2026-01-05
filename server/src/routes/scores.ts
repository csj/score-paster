import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getScoresContainer } from '../database/cosmos.js';
import { Score } from '../database/models.js';
import { trackEvent, trackMetric, logInfo, logError } from '../utils/appinsights.js';

const router = Router();

router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { rawPaste, gameType, gameDate, scoreData } = req.body;
    
    // Validate required fields (client should have parsed these)
    if (!gameType || typeof gameType !== 'string') {
      return res.status(400).json({ error: 'gameType is required' });
    }
    
    if (!gameDate || typeof gameDate !== 'string') {
      return res.status(400).json({ error: 'gameDate is required' });
    }
    
    if (!scoreData || typeof scoreData !== 'object') {
      return res.status(400).json({ error: 'scoreData is required' });
    }
    
    // Validate scoreData has required fields
    if (typeof scoreData.displayScore !== 'string') {
      return res.status(400).json({ error: 'scoreData.displayScore is required' });
    }
    
    if (typeof scoreData.sortScore !== 'number') {
      return res.status(400).json({ error: 'scoreData.sortScore is required' });
    }
    
    // Check if user already has a score for this game and date (first attempts only!)
    const container = await getScoresContainer();
    const { resources: existingScores } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.userId = @userId AND c.gameType = @gameType AND c.gameDate = @gameDate',
        parameters: [
          { name: '@userId', value: req.user.id },
          { name: '@gameType', value: gameType },
          { name: '@gameDate', value: gameDate },
        ],
      })
      .fetchAll();
    
    if (existingScores.length > 0) {
      return res.status(409).json({ error: 'first attempts only!' });
    }
    
    // Store score in Cosmos DB
    const now = new Date().toISOString();
    
    const score: Score = {
      id: `${req.user.id}:${gameType}:${gameDate}:${Date.now()}`,
      userId: req.user.id,
      gameType,
      gameDate,
      scoreData, // Already enriched with displayScore, sortScore, and game-specific fields
      rawPaste: rawPaste || '', // Optional, for reference/debugging
      createdAt: now,
    };
    
    const { resource } = await container.items.create(score);
    
    trackEvent('score_pasted', {
      userId: req.user.id,
      gameType,
      provider: req.user.provider,
    });
    trackMetric('score_submissions', 1);
    logInfo('Score stored successfully', { userId: req.user.id, gameType, scoreId: resource?.id || 'unknown' });
    
    res.json({
      success: true,
      gameType,
      scoreData,
      scoreId: resource?.id,
    });
  } catch (error) {
    logError(error as Error, { userId: req.user?.id || 'unknown', endpoint: '/api/scores' });
    res.status(500).json({ error: 'Failed to store score' });
  }
});

export default router;