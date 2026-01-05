import { Router, Request, Response } from 'express';
import { getGoogleAuthUrl, handleGoogleCallback } from '../oauth/google.js';
import { getFacebookAuthUrl, handleFacebookCallback } from '../oauth/facebook.js';
import { getMicrosoftAuthUrl, handleMicrosoftCallback } from '../oauth/microsoft.js';
import { authenticate } from '../middleware/auth.js';
import { logError } from '../utils/appinsights.js';

const router = Router();

// Initiate OAuth flows
router.get('/google', (req: Request, res: Response) => {
  const authUrl = getGoogleAuthUrl();
  res.redirect(authUrl);
});

router.get('/facebook', (req: Request, res: Response) => {
  const authUrl = getFacebookAuthUrl();
  res.redirect(authUrl);
});

router.get('/microsoft', (req: Request, res: Response) => {
  const authUrl = getMicrosoftAuthUrl();
  res.redirect(authUrl);
});

// OAuth callbacks
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' });
    }
    
    const { token, user } = await handleGoogleCallback(code);
    
    // In production, set token in HTTP-only cookie or return to frontend securely
    // For now, redirect with token in query (not secure, but works for development)
    res.redirect(`/?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  } catch (error) {
    logError(error as Error, { provider: 'google' });
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/facebook/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' });
    }
    
    const { token, user } = await handleFacebookCallback(code);
    
    res.redirect(`/?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  } catch (error) {
    logError(error as Error, { provider: 'facebook' });
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/microsoft/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' });
    }
    
    const { token, user, roles } = await handleMicrosoftCallback(code);
    
    const userWithRoles = { ...user, roles };
    res.redirect(`/?token=${token}&user=${encodeURIComponent(JSON.stringify(userWithRoles))}`);
  } catch (error) {
    logError(error as Error, { provider: 'microsoft' });
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  // In production, invalidate token server-side
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticate, (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json(req.user);
});

export default router;