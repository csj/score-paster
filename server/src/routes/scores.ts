import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { tryParseScore } from '../parsers/index.js';
import { getScoresContainer } from '../database/cosmos.js';
import { Score } from '../database/models.js';
import { trackEvent, trackMetric, logInfo, logError } from '../utils/appinsights.js';

const router = Router();

router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { rawPaste } = req.body;
    
    if (!rawPaste || typeof rawPaste !== 'string') {
      return res.status(400).json({ error: 'rawPaste is required' });
    }
    
    // Try to parse the score with all parsers
    const parseResult = tryParseScore(rawPaste);
    
    if (!parseResult) {
      // Phase 1: Return error if unrecognized
      // Phase 2: Will store in UnrecognizedPastes
      trackMetric('score_parse_failed', 1);
      logInfo('Score parse failed', { userId: req.user.id, rawPasteLength: rawPaste.length });
      return res.status(400).json({
        success: false,
        error: 'Could not recognize score format. Please check your paste and try again.',
      });
    }
    
    const { gameType, scoreData } = parseResult;
    
    // Store score in Cosmos DB
    const container = await getScoresContainer();
    const now = new Date().toISOString();
    
    const score: Score = {
      id: `${req.user.id}:${gameType}:${scoreData.gameDate}:${Date.now()}`,
      userId: req.user.id,
      gameType,
      gameDate: scoreData.gameDate as string,
      scoreData,
      rawPaste,
      createdAt: now,
    };
    
    const { resource } = await container.items.create(score);
    
    trackEvent('score_pasted', {
      userId: req.user.id,
      gameType,
      provider: req.user.provider,
    });
    trackMetric('score_submissions', 1);
    logInfo('Score stored successfully', { userId: req.user.id, gameType, scoreId: resource?.id });
    
    res.json({
      success: true,
      gameType,
      scoreData,
      scoreId: resource?.id,
    });
  } catch (error) {
    logError(error as Error, { userId: req.user?.id, endpoint: '/api/scores' });
    res.status(500).json({ error: 'Failed to store score' });
  }
});

export default router;