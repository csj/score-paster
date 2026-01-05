import { Request, Response, NextFunction } from 'express';
import { verifyToken, getCompositeUserId, TokenClaims } from '../utils/jwt.js';
import { getUserById } from '../database/users.js';
import { logError } from '../utils/appinsights.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        displayName: string;
        avatarUrl?: string;
        provider: 'google' | 'facebook' | 'microsoft';
        roles?: string[];
      };
      tokenClaims?: TokenClaims;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token and extract claims
    const claims = await verifyToken(token);
    
    // Get composite user ID
    const userId = getCompositeUserId(claims);
    
    // Get user from database
    const user = await getUserById(userId);
    
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    
    // Attach user and claims to request
    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      roles: claims.roles,
    };
    req.tokenClaims = claims;
    
    next();
  } catch (error) {
    logError(error as Error, { endpoint: req.path });
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}