# Score Paster Platform

A social score-sharing platform where users paste game results (Wordle, Connections, etc.), scores are automatically linked to their account and appear on all relevant scoreboards (global + private boards they're members of).

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express + TypeScript
- **Database**: Azure Cosmos DB (with local emulator support)
- **Deployment**: Azure App Service
- **Monitoring**: Azure Application Insights
- **Authentication**: Google OAuth, Facebook OAuth, Microsoft/Entra ID OAuth

## Project Structure

```
scorepaster/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── services/    # API client and auth
│   │   └── utils/       # Utilities (parsers, etc.)
│   └── package.json
├── server/              # Express backend
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth and admin middleware
│   │   ├── oauth/       # OAuth handlers
│   │   ├── parsers/     # Game score parsers
│   │   ├── database/    # Cosmos DB client and models
│   │   └── utils/       # Utilities (JWT, App Insights)
│   └── package.json
└── package.json         # Root package.json with scripts
```

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Azure Cosmos DB Emulator (for local development) OR Azure Cosmos DB account
- OAuth app registrations:
  - Google OAuth 2.0 Client ID
  - Facebook App ID
  - Microsoft/Entra ID App Registration

### Local Cosmos DB Emulator Setup

**Windows:**
1. Download and install from: https://aka.ms/cosmosdb-emulator
2. Or use Chocolatey: `choco install azure-cosmosdb-emulator`
3. Start the emulator from Start Menu

**Linux/Mac (Docker):**
```bash
docker run -p 8081:8081 -p 10250-10255:10250-10255 mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator
```

The emulator runs on `https://localhost:8081` by default.

### Installation

1. Install root dependencies:
```bash
npm install
```

2. Install client dependencies:
```bash
cd client && npm install && cd ..
```

3. Install server dependencies:
```bash
cd server && npm install && cd ..
```

### Environment Variables

Create `.env` file in the `server/` directory:

**server/.env**
```env
# Cosmos DB (defaults to local emulator)
COSMOS_DB_ENDPOINT=https://localhost:8081/
COSMOS_DB_KEY=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==

# Application Insights (optional for local dev)
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/auth/facebook/callback

# Microsoft/Entra ID OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=your-tenant-id
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/microsoft/callback

# Server
PORT=3000
```

**Note:** The Cosmos DB defaults above are for the local emulator. For production, use your Azure Cosmos DB endpoint and key.

### Running Development Servers

From the root directory:

```bash
npm run dev
```

This runs:
- Vite dev server on port 5173 (React with HMR)
- Express API server on port 3000

The Vite server proxies `/api` requests to the Express server.

### Building for Production

```bash
npm run build
```

This builds:
- React app → `server/client/dist/`
- Express TypeScript → `server/dist/`

### Running Production Build

```bash
npm start
```

Starts the Express server which serves both the React app and API.

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/facebook` - Initiate Facebook OAuth
- `GET /api/auth/microsoft` - Initiate Microsoft OAuth
- `GET /api/auth/{provider}/callback` - OAuth callback
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout

### Scores
- `POST /api/scores` - Paste and parse a score (requires auth)
  - Body: `{ rawPaste: string }`
  - Returns: `{ success: true, gameType: string, scoreData: {...} }`

### Scoreboards (Board-First Architecture)
- `GET /api/scoreboards/{boardSlug}` - Get scoreboard info
- `GET /api/scoreboards/{boardSlug}/scores/{gameType}` - Get scores for a board and game
  - Example: `/api/scoreboards/global/scores/wordle`
  - Example: `/api/scoreboards/my-private/scores/wordle`
- `POST /api/scoreboards` - Create private scoreboard (requires auth)
  - Body: `{ name: string, slug: string }`
- `GET /api/scoreboards/{slug}/join?code=ABC123` - Join scoreboard via invite code (requires auth)
- `GET /api/scoreboards/my-boards` - Get user's scoreboards (requires auth)

## Game Parsers

The system automatically detects game type by trying parsers in order:

1. **Wordle**: Parses format like "Wordle XXX X/6"
2. **Connections**: Parses format like "Connections Puzzle #XXX"

To add a new game parser:
1. Create parser in `server/src/parsers/` and `client/src/utils/parsers/`
2. Register in `server/src/parsers/index.ts` and `client/src/utils/parsers/index.ts`

## Architecture: Board-First Design

Scoreboards are board-first, game-second:
- Users create private scoreboards (not tied to a specific game)
- Scores from multiple games can be posted to the same board
- View scores by board and game: `/boards/{slug}/scores/{gameType}`
- Global board: `/boards/global/scores/{gameType}`

## Phase 2 Features (Admin)

Phase 2 adds admin features for managing unrecognized pastes:
- UnrecognizedPastes container
- Admin endpoints (requires Entra ID Admin role)
- Admin UI for reviewing and promoting unrecognized pastes

## License

MIT