import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../services/auth';

export default function UsernameEditor() {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username || user.displayName || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    const trimmed = username.trim();
    if (!trimmed) {
      setError('Username cannot be empty');
      return;
    }

    if (trimmed === (user.username || user.displayName)) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updatedUser = await apiRequest<typeof user>('/api/auth/me/username', {
        method: 'PATCH',
        body: JSON.stringify({ username: trimmed }),
      });

      // Update user in auth context
      if (setUser) {
        setUser(updatedUser);
      }
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update username');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setUsername(user?.username || user?.displayName || '');
    setEditing(false);
    setError(null);
  };

  if (!user) {
    return null;
  }

  const displayUsername = user.username || user.displayName;

  return (
    <div style={{
      padding: '1rem',
      marginBottom: '1rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      {!editing ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
              Your username (shown on leaderboards):
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>
              {displayUsername}
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
        </div>
      ) : (
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(null);
            }}
            placeholder={user.displayName}
            maxLength={30}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginBottom: '0.5rem',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            autoFocus
          />
          <small style={{ display: 'block', color: '#666', marginBottom: '0.5rem' }}>
            1-30 characters. Letters, numbers, spaces, hyphens, and underscores only.
          </small>
          {error && (
            <div style={{
              marginBottom: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#ffebee',
              color: '#c62828',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                backgroundColor: saving ? '#ccc' : '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                backgroundColor: '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
