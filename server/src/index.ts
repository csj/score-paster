import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeAppInsights } from './utils/appinsights.js';
import { initializeDatabase } from './database/cosmos.js';
import authRoutes from './routes/auth.js';
import scoresRoutes from './routes/scores.js';
import scoreboardsRoutes from './routes/scoreboards.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Application Insights
initializeAppInsights();

// Initialize Cosmos DB
initializeDatabase().catch(console.error);

const app = express();
app.use(express.json());

// API routes (before static files)
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/scoreboards', scoreboardsRoutes);

// Serve static files from Vite build
const staticPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(staticPath));

// React Router catch-all: serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(staticPath, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});