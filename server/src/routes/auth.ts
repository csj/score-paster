import { Router, Request, Response } from 'express';
import { getGoogleAuthUrl, handleGoogleCallback } from '../oauth/google.js';
import { getMicrosoftAuthUrl, handleMicrosoftCallback } from '../oauth/microsoft.js';
import { authenticate } from '../middleware/auth.js';
import { logError } from '../utils/appinsights.js';

const router = Router();

// Get frontend URL from request (Origin, Referer, or fallback)
function getFrontendUrlFromRequest(req: Request): string | null {
  // Check Origin header first (most reliable)
  const origin = req.get('origin');
  if (origin) {
    return origin;
  }
  
  // Check Referer header
  const referer = req.get('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      return `${url.protocol}//${url.host}`;
    } catch {
      // Invalid referer, ignore
    }
  }
  
  return null;
}

// Initiate OAuth flows
router.get('/google', (req: Request, res: Response) => {
  // Capture frontend URL and pass it via state parameter
  const frontendUrl = getFrontendUrlFromRequest(req);
  const state = frontendUrl ? encodeURIComponent(frontendUrl) : '';
  const authUrl = getGoogleAuthUrl(state);
  res.redirect(authUrl);
});

router.get('/microsoft', (req: Request, res: Response) => {
  // Capture frontend URL and pass it via state parameter
  const frontendUrl = getFrontendUrlFromRequest(req);
  const state = frontendUrl ? encodeURIComponent(frontendUrl) : '';
  const authUrl = getMicrosoftAuthUrl(state);
  res.redirect(authUrl);
});

// Get frontend URL from state or request
function getFrontendUrl(req: Request, state?: string): string {
  // First, try to get from state parameter (passed through OAuth flow)
  if (state) {
    try {
      return decodeURIComponent(state);
    } catch {
      // Invalid state, continue
    }
  }
  
  // Fall back to request headers
  const fromRequest = getFrontendUrlFromRequest(req);
  if (fromRequest) {
    return fromRequest;
  }
  
  // Last resort: use environment variable or default
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }
  
  // In production, use same origin as request
  if (process.env.NODE_ENV === 'production') {
    const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
    const host = req.get('host') || 'localhost:3000';
    return `${protocol}://${host}`;
  }
  
  // Development fallback (shouldn't reach here if Origin/Referer are set)
  return 'http://localhost:5173';
}

// OAuth callbacks
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' });
    }
    
    const { token, user } = await handleGoogleCallback(code);
    
    // Redirect to frontend with token (use state to get original frontend URL)
    const frontendUrl = getFrontendUrl(req, typeof state === 'string' ? state : undefined);
    res.redirect(`${frontendUrl}/?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  } catch (error) {
    logError(error as Error, { provider: 'google' });
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/microsoft/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' });
    }
    
    const { token, user, roles } = await handleMicrosoftCallback(code);
    
    const userWithRoles = { ...user, roles };
    // Redirect to frontend with token (use state to get original frontend URL)
    const frontendUrl = getFrontendUrl(req, typeof state === 'string' ? state : undefined);
    res.redirect(`${frontendUrl}/?token=${token}&user=${encodeURIComponent(JSON.stringify(userWithRoles))}`);
  } catch (error) {
    logError(error as Error, { provider: 'microsoft' });
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  // In production, invalidate token server-side
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticate, (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json(req.user);
});

// Update username
router.patch('/me/username', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { username } = req.body;
    
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'username is required' });
    }
    
    // Validate username (alphanumeric, spaces, hyphens, underscores, 1-30 chars)
    if (!/^[a-zA-Z0-9 _-]{1,30}$/.test(username.trim())) {
      return res.status(400).json({ error: 'Username must be 1-30 characters and contain only letters, numbers, spaces, hyphens, and underscores' });
    }
    
    const { updateUsername } = await import('../database/users.js');
    const updatedUser = await updateUsername(req.user.id, username.trim());
    
    res.json(updatedUser);
  } catch (error) {
    logError(error as Error, { userId: req.user?.id || 'unknown', endpoint: '/api/auth/me/username' });
    res.status(500).json({ error: 'Failed to update username' });
  }
});

export default router;