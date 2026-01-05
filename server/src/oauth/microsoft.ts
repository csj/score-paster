import { createOrUpdateUser } from '../database/users.js';
import { logInfo, logError, trackEvent } from '../utils/appinsights.js';

const clientId = process.env.MICROSOFT_CLIENT_ID || '';
const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || '';
const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/api/auth/microsoft/callback';

export function getMicrosoftAuthUrl(state?: string): string {
  if (!clientId) {
    throw new Error('MICROSOFT_CLIENT_ID is not configured. Please set it in server/.env file. See LOCAL_DEVELOPMENT.md for setup instructions.');
  }
  
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: 'openid profile email',
    state: state || 'microsoft-auth-state', // Pass frontend URL through OAuth flow
  });
  
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function handleMicrosoftCallback(code: string): Promise<{ token: string; user: any; roles?: string[] }> {
  if (!clientId || !clientSecret) {
    throw new Error('Microsoft OAuth credentials are not configured. Please set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in server/.env file.');
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          scope: 'openid profile email',
        }),
      }
    );
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to exchange code for token: ${errorText}`);
    }
    
    const tokenData = await tokenResponse.json();
    const idToken = tokenData.id_token;
    
    if (!idToken) {
      throw new Error('No ID token received from Microsoft');
    }
    
    // Decode the ID token (we'll validate it properly in the JWT middleware)
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
    
    // Extract user information from ID token
    const providerUserId = payload.sub;
    const email = payload.email || payload.preferred_username || '';
    const displayName = payload.name || '';
    const roles = payload.roles || [];
    // Note: Avatar URL not available with basic OpenID Connect scopes (would require User.Read)
    const avatarUrl: string | undefined = undefined;
    
    // Create or update user in database
    const user = await createOrUpdateUser(
      'microsoft',
      providerUserId,
      email,
      displayName,
      avatarUrl
    );
    
    trackEvent('user_logged_in', { provider: 'microsoft', userId: user.id, hasAdminRole: roles.includes('Admin') ? 'true' : 'false' });
    logInfo('Microsoft OAuth successful', { userId: user.id, email, hasAdminRole: roles.includes('Admin') });
    
    return {
      token: idToken, // Return the Microsoft ID token
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        username: user.username || user.displayName,
        avatarUrl: user.avatarUrl,
        provider: 'microsoft',
      },
      roles,
    };
  } catch (error) {
    logError(error as Error, { provider: 'microsoft' });
    throw error;
  }
}