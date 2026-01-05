import { Request, Response, NextFunction } from 'express';
import { hasAdminRole } from '../utils/jwt.js';
import { logWarning } from '../utils/appinsights.js';

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.tokenClaims) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  if (!hasAdminRole(req.tokenClaims)) {
    logWarning('Admin access denied', { userId: req.user?.id || 'unknown', endpoint: req.path });
    res.status(403).json({ error: 'Admin role required' });
    return;
  }
  
  next();
}