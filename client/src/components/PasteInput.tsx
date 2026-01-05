import { useState } from 'react';
import { tryParseScore } from '../utils/parsers';
import { apiRequest } from '../services/api';

export default function PasteInput() {
  const [rawPaste, setRawPaste] = useState('');
  const [parseResult, setParseResult] = useState<{ gameType: string; scoreData: any } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setRawPaste(text);
    setError(null);
    setSuccess(false);
    
    if (text.trim()) {
      const result = tryParseScore(text);
      setParseResult(result);
    } else {
      setParseResult(null);
    }
  };

  const handleSubmit = async () => {
    if (!rawPaste.trim()) {
      setError('Please paste your score');
      return;
    }

    if (!parseResult) {
      setError('Could not recognize score format. Please check your paste and try again.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Submit enriched payload with parsed data
      await apiRequest('/api/scores', {
        method: 'POST',
        body: JSON.stringify({
          rawPaste, // Keep for reference/debugging
          gameType: parseResult.gameType,
          gameDate: parseResult.scoreData.gameDate,
          scoreData: parseResult.scoreData, // Includes displayScore, sortScore, and game-specific fields
        }),
      });
      
      setSuccess(true);
      setRawPaste('');
      setParseResult(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Paste Your Score</h2>
      
      <textarea
        value={rawPaste}
        onChange={handlePaste}
        placeholder="Paste your game result here..."
        style={{
          width: '100%',
          minHeight: '200px',
          padding: '1rem',
          fontSize: '1rem',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontFamily: 'monospace',
          resize: 'vertical',
        }}
      />

      {parseResult ? (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#e8f5e9',
          borderRadius: '4px',
        }}>
          <strong>Detected:</strong> {parseResult.gameType}
          <br />
          <strong>Score:</strong> {parseResult.scoreData.displayScore}
          <br />
          <small style={{ fontSize: '0.875rem', color: '#666' }}>
            {parseResult.scoreData.gameDate}
          </small>
        </div>
      ) : rawPaste.trim() ? (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
        }}>
          <strong>Format not recognized</strong> - Please check your paste and try again.
        </div>
      ) : null}

      {error && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          borderRadius: '4px',
        }}>
          Score submitted successfully!
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!parseResult || submitting}
        style={{
          marginTop: '1rem',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          backgroundColor: parseResult && !submitting ? '#1976d2' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: parseResult && !submitting ? 'pointer' : 'not-allowed',
          width: '100%',
        }}
      >
        {submitting ? 'Submitting...' : 'Submit Score'}
      </button>
    </div>
  );
}