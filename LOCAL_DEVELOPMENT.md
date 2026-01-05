# Local Development Setup

## Cosmos DB Emulator

The project is configured to use the Azure Cosmos DB Emulator for local development by default.

### Windows Setup

1. **Download and Install:**
   - Download from: https://aka.ms/cosmosdb-emulator
   - Or use Chocolatey: `choco install azure-cosmosdb-emulator`

2. **Start the Emulator:**
   - Launch "Azure Cosmos DB Emulator" from Start Menu
   - It will start on `https://localhost:8081`

3. **Verify it's running:**
   - Open browser to: https://localhost:8081/_explorer/index.html
   - You should see the Data Explorer interface

### Linux/Mac Setup (Docker)

```bash
docker run -p 8081:8081 -p 10250-10255:10250-10255 mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator
```

### Configuration

The emulator is automatically configured in `server/src/database/cosmos.ts` with these defaults:

- **Endpoint**: `https://localhost:8081/`
- **Key**: `C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==`

These are set as defaults in the code, so you don't need to configure them in `.env` unless you want to override.

### Using Production Cosmos DB

If you want to use your production Cosmos DB instead:

1. Create `server/.env` file
2. Set:
   ```env
   COSMOS_DB_ENDPOINT=https://your-account.documents.azure.com:443/
   COSMOS_DB_KEY=your-production-key
   ```

**Note:** Be careful not to commit production credentials to git!

## Running the Application

1. **Start Cosmos DB Emulator** (if using local emulator)

2. **Install dependencies:**
   ```bash
   npm install
   cd client && npm install && cd ..
   cd server && npm install && cd ..
   ```

3. **Set up OAuth credentials** in `server/.env` (see OAuth Setup section below)

4. **Start development servers:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - API: http://localhost:3000

## Troubleshooting

### SSL Certificate Errors

The local emulator uses a self-signed certificate. The code automatically disables SSL verification for localhost connections. If you see SSL errors, make sure:
- The endpoint includes `localhost` or `127.0.0.1`
- The code sets `NODE_TLS_REJECT_UNAUTHORIZED=0` for local emulator

### Connection Refused

If you get connection errors:
1. Verify the emulator is running
2. Check the endpoint is `https://localhost:8081/`
3. Try accessing the emulator in your browser: https://localhost:8081/_explorer/index.html

### Port Already in Use

If port 8081 is already in use:
- Stop other instances of the emulator
- Or change the emulator port (requires updating the endpoint in code)

## OAuth Setup

You need to register OAuth applications with each provider to get client IDs and secrets.

### Microsoft/Entra ID Setup

1. **Go to Azure Portal:**
   - Navigate to https://portal.azure.com
   - Sign in with your Microsoft account

2. **Register an App:**
   - Go to **Azure Active Directory** (or **Microsoft Entra ID**)
   - Click **App registrations** → **New registration**
   - Name: `ScorePaster` (or your choice)
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: `http://localhost:3000/api/auth/microsoft/callback` (Platform: Web)
   - Click **Register**
   
   **Note:** After registration, go to **API permissions**:
   - You should see `openid`, `profile`, and `email` permissions (these are added automatically)
   - These are basic OpenID Connect scopes that don't require admin consent
   - Users can consent themselves - no admin approval needed
   - You may still see an "Unverified" warning - this is normal for personal/development apps and users can safely proceed

3. **Get Your Credentials:**
   - **Application (client) ID**: Copy from the Overview page
   - **Directory (tenant) ID**: Copy from the Overview page
   - **Client secret**: 
     - Go to **Certificates & secrets**
     - Click **New client secret**
     - Description: `Local Development`
     - Expires: Choose an expiration (e.g., 24 months)
     - Click **Add**
     - **Copy the Value immediately** (you won't see it again!)

4. **Configure App Roles (for Admin access - Phase 2):**
   - Go to **App roles** → **Create app role**
   - Display name: `Admin`
   - Allowed member types: **Users/Groups**
   - Value: `Admin`
   - Description: `Administrator role for ScorePaster`
   - Click **Create**
   - **Assign the role to yourself:**
     - Go to **Enterprise applications** → Find your app → **Users and groups**
     - Click **Add user/group** → Select yourself → Select the `Admin` role → **Assign**

5. **Add to `server/.env`:**
   ```env
   MICROSOFT_CLIENT_ID=your-client-id-here
   MICROSOFT_CLIENT_SECRET=your-client-secret-here
   MICROSOFT_TENANT_ID=your-tenant-id-here
   MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/microsoft/callback
   ```

### Google OAuth Setup

1. **Go to Google Cloud Console:**
   - Navigate to https://console.cloud.google.com
   - Create a new project or select an existing one

2. **Enable Google+ API:**
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" and enable it

3. **Create OAuth Credentials:**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `ScorePaster Local`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
   - Click **Create**
   - Copy the **Client ID** and **Client secret**

4. **Add to `server/.env`:**
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id-here
   GOOGLE_CLIENT_SECRET=your-google-client-secret-here
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
   ```

### Complete `.env` File Template

Create `server/.env` with all your OAuth credentials:

```env
# Cosmos DB (defaults to local emulator, optional)
# COSMOS_DB_ENDPOINT=https://localhost:8081/
# COSMOS_DB_KEY=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==

# Application Insights (optional for local dev)
# APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Microsoft/Entra ID OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=your-tenant-id
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/microsoft/callback

# Server
PORT=3000
```

**Important:** Add `server/.env` to `.gitignore` to avoid committing credentials!