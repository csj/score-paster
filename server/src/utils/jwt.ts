import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { OAuth2Client } from 'google-auth-library';
import { logError } from './appinsights.js';

export interface TokenClaims {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  iss: string;
  aud?: string;
  exp: number;
  iat: number;
  roles?: string[];
  [key: string]: unknown;
}

// Google JWKS client (unused but kept for potential future use)
// const googleClient = jwksClient({
//   jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
// });

// Microsoft/Entra ID JWKS client
function getMicrosoftJwksClient(tenantId: string) {
  return jwksClient({
    jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
  });
}

// Google OAuth client for verification
const googleOAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyToken(token: string): Promise<TokenClaims> {
  // Decode token to get issuer
  const decoded = jwt.decode(token, { complete: true });
  
  if (!decoded || typeof decoded === 'string' || !decoded.payload) {
    throw new Error('Invalid token format');
  }
  
  const payload = decoded.payload as TokenClaims;
  const issuer = payload.iss || '';
  
  // Determine provider from issuer
  if (issuer.includes('accounts.google.com')) {
    return verifyGoogleToken(token);
  } else if (issuer.includes('login.microsoftonline.com')) {
    return verifyMicrosoftToken(token);
  } else {
    throw new Error(`Unsupported token issuer: ${issuer}`);
  }
}

async function verifyGoogleToken(token: string): Promise<TokenClaims> {
  try {
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid Google token payload');
    }
    
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      iss: payload.iss || '',
      aud: payload.aud,
      exp: payload.exp || 0,
      iat: payload.iat || 0,
    };
  } catch (error) {
    logError(error as Error, { provider: 'google' });
    throw new Error('Failed to verify Google token');
  }
}

async function verifyMicrosoftToken(token: string): Promise<TokenClaims> {
  try {
    // Extract tenant ID from token
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string' || !decoded.header) {
      throw new Error('Invalid token format');
    }
    
    const payload = decoded.payload as TokenClaims;
    const tenantId = extractTenantIdFromIssuer(payload.iss);
    
    const client = getMicrosoftJwksClient(tenantId);
    
    function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
      if (!header.kid) {
        callback(new Error('No kid in header'));
        return;
      }
      
      client.getSigningKey(header.kid, (err, key) => {
        if (err) {
          callback(err);
          return;
        }
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
      });
    }
    
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        {
          audience: process.env.MICROSOFT_CLIENT_ID,
          issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
        },
        (err, decoded) => {
          if (err) {
            logError(err as Error, { provider: 'microsoft' });
            reject(new Error('Failed to verify Microsoft token'));
            return;
          }
          
          const claims = decoded as TokenClaims;
          resolve(claims);
        }
      );
    });
  } catch (error) {
    logError(error as Error, { provider: 'microsoft' });
    throw new Error('Failed to verify Microsoft token');
  }
}

function extractTenantIdFromIssuer(iss: string): string {
  // Extract tenant ID from issuer: https://login.microsoftonline.com/{tenantId}/v2.0
  const match = iss.match(/login\.microsoftonline\.com\/([^/]+)/);
  return match ? match[1] : 'common';
}

export function getCompositeUserId(claims: TokenClaims): string {
  const provider = getProviderFromIssuer(claims.iss);
  return `${provider}:${claims.sub}`;
}

function getProviderFromIssuer(iss: string): 'google' | 'microsoft' {
  if (iss.includes('accounts.google.com')) {
    return 'google';
  } else if (iss.includes('login.microsoftonline.com')) {
    return 'microsoft';
  }
  throw new Error(`Unknown issuer: ${iss}`);
}

export function hasAdminRole(claims: TokenClaims): boolean {
  // Only Microsoft/Entra ID tokens can have Admin role
  if (!claims.iss.includes('microsoftonline.com')) {
    return false;
  }
  return claims.roles?.includes('Admin') ?? false;
}