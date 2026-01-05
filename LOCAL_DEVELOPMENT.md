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

3. **Set up OAuth credentials** in `server/.env`:
   - Google OAuth Client ID and Secret
   - Facebook App ID and Secret
   - Microsoft/Entra ID Client ID, Secret, and Tenant ID

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