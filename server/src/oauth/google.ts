import { OAuth2Client } from 'google-auth-library';
import { createOrUpdateUser } from '../database/users.js';
import { logInfo, logError, trackEvent } from '../utils/appinsights.js';

const clientId = process.env.GOOGLE_CLIENT_ID || '';
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

export const googleOAuthClient = new OAuth2Client(clientId, clientSecret, redirectUri);

export function getGoogleAuthUrl(state?: string): string {
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured. Please set it in server/.env file. See LOCAL_DEVELOPMENT.md for setup instructions.');
  }
  
  const scopes = ['profile', 'email'];
  return googleOAuthClient.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    // Only prompt for consent if needed (not every time)
    prompt: 'select_account',
    state: state || undefined, // Pass frontend URL through OAuth flow
  });
}

export async function handleGoogleCallback(code: string): Promise<{ token: string; user: any }> {
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials are not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env file.');
  }
  
  try {
    // Exchange code for tokens
    const { tokens } = await googleOAuthClient.getToken(code);
    googleOAuthClient.setCredentials(tokens);
    
    if (!tokens.id_token) {
      throw new Error('No ID token received from Google');
    }
    
    // Verify and decode the ID token
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid token payload');
    }
    
    // Extract user information
    const providerUserId = payload.sub;
    const email = payload.email || '';
    const displayName = payload.name || '';
    const avatarUrl = payload.picture;
    
    // Create or update user in database
    const user = await createOrUpdateUser(
      'google',
      providerUserId,
      email,
      displayName,
      avatarUrl
    );
    
    trackEvent('user_logged_in', { provider: 'google', userId: user.id });
    logInfo('Google OAuth successful', { userId: user.id, email });
    
    // Return token and user info
    return {
      token: tokens.id_token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        username: user.username || user.displayName,
        avatarUrl: user.avatarUrl,
        provider: 'google',
      },
    };
  } catch (error) {
    logError(error as Error, { provider: 'google' });
    throw error;
  }
}