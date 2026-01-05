// Track if we're currently refreshing to avoid infinite loops
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Decode JWT to check expiration (without verification)
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true; // Invalid token format
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;
    
    if (!exp) {
      return true; // No expiration claim
    }
    
    // Check if token is expired (with 60 second buffer)
    const now = Math.floor(Date.now() / 1000);
    return exp < (now + 60);
  } catch {
    return true; // Can't decode, assume expired
  }
}

async function checkTokenValidity(): Promise<boolean> {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return false;
  }

  // Check expiration locally first (faster)
  if (isTokenExpired(token)) {
    return false;
  }

  // Still verify with server (token might be invalid for other reasons)
  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function attemptTokenRefresh(): Promise<boolean> {
  // If already refreshing, wait for that to complete
  if (refreshPromise) {
    return refreshPromise;
  }

  // Check if token is still valid (maybe it was a transient error)
  refreshPromise = checkTokenValidity();
  const isValid = await refreshPromise;
  refreshPromise = null;

  if (!isValid) {
    // Token is truly invalid - clear it
    localStorage.removeItem('auth_token');
    // Dispatch event so AuthProvider can update state
    window.dispatchEvent(new CustomEvent('auth:token-invalid'));
  }

  return isValid;
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  // Check if token is expired before making request
  if (token && isTokenExpired(token)) {
    // Token is expired - clear it and notify
    localStorage.removeItem('auth_token');
    window.dispatchEvent(new CustomEvent('auth:token-invalid'));
    throw new Error('Your session has expired. Please log in again.');
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - token might be invalid for other reasons
  if (response.status === 401 && retryCount === 0) {
    const errorData = await response.json().catch(() => ({ error: 'Unauthorized' }));
    
    // Check if token is still valid (maybe it was a transient error)
    const refreshed = await attemptTokenRefresh();
    
    if (refreshed) {
      // Token is still valid, retry the request once
      return apiRequest<T>(url, options, retryCount + 1);
    }
    
    // Token is invalid - throw error (caller should handle login redirect)
    throw new Error('Your session has expired. Please log in again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.statusText}`);
  }

  return response.json();
}