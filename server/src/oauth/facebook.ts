import { createOrUpdateUser } from '../database/users.js';
import { logInfo, logError, trackEvent } from '../utils/appinsights.js';

const appId = process.env.FACEBOOK_APP_ID || '';
const appSecret = process.env.FACEBOOK_APP_SECRET || '';
const redirectUri = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/api/auth/facebook/callback';

export function getFacebookAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'email,public_profile',
    response_type: 'code',
  });
  
  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

export async function handleFacebookCallback(code: string): Promise<{ token: string; user: any }> {
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      throw new Error('No access token received from Facebook');
    }
    
    // Get user info from Facebook Graph API
    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${accessToken}`
    );
    
    if (!userResponse.ok) {
      throw new Error('Failed to get user info from Facebook');
    }
    
    const fbUser = await userResponse.json();
    
    // Extract user information
    const providerUserId = fbUser.id;
    const email = fbUser.email || '';
    const displayName = fbUser.name || '';
    const avatarUrl = fbUser.picture?.data?.url;
    
    // Create or update user in database
    const user = await createOrUpdateUser(
      'facebook',
      providerUserId,
      email,
      displayName,
      avatarUrl
    );
    
    trackEvent('user_logged_in', { provider: 'facebook', userId: user.id });
    logInfo('Facebook OAuth successful', { userId: user.id, email });
    
    // For Facebook, we'll create a simple JWT-like token
    // In production, you might want to use a proper JWT library
    const token = Buffer.from(JSON.stringify({
      sub: user.id,
      provider: 'facebook',
      email: user.email,
      name: user.displayName,
    })).toString('base64');
    
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        provider: 'facebook',
      },
    };
  } catch (error) {
    logError(error as Error, { provider: 'facebook' });
    throw error;
  }
}