# Azure App Service Deployment Guide

## Prerequisites

1. Azure subscription
2. Azure CLI installed and logged in
3. Application built (`npm run build`)

## Step 1: Create Azure Resources

### Create Resource Group
```bash
az group create --name scorepaster-rg --location eastus
```

### Create Cosmos DB Account
```bash
az cosmosdb create \
  --name scorepaster-cosmos \
  --resource-group scorepaster-rg \
  --default-consistency-level Session
```

### Create Application Insights
```bash
az monitor app-insights component create \
  --app scorepaster-insights \
  --location eastus \
  --resource-group scorepaster-rg
```

### Create App Service Plan
```bash
az appservice plan create \
  --name scorepaster-plan \
  --resource-group scorepaster-rg \
  --sku B1 \
  --is-linux
```

### Create App Service
```bash
az webapp create \
  --name scorepaster-app \
  --resource-group scorepaster-rg \
  --plan scorepaster-plan \
  --runtime "NODE:18-lts"
```

## Step 2: Configure Environment Variables

Get your Cosmos DB connection details:
```bash
az cosmosdb show --name scorepaster-cosmos --resource-group scorepaster-rg --query documentEndpoint
az cosmosdb keys list --name scorepaster-cosmos --resource-group scorepaster-rg --query primaryMasterKey
```

Get Application Insights connection string:
```bash
az monitor app-insights component show \
  --app scorepaster-insights \
  --resource-group scorepaster-rg \
  --query connectionString
```

Set environment variables in App Service:
```bash
az webapp config appsettings set \
  --name scorepaster-app \
  --resource-group scorepaster-rg \
  --settings \
    COSMOS_DB_ENDPOINT="your-endpoint" \
    COSMOS_DB_KEY="your-key" \
    APPLICATIONINSIGHTS_CONNECTION_STRING="your-connection-string" \
    GOOGLE_CLIENT_ID="your-google-client-id" \
    GOOGLE_CLIENT_SECRET="your-google-client-secret" \
    GOOGLE_REDIRECT_URI="https://scorepaster-app.azurewebsites.net/api/auth/google/callback" \
    FACEBOOK_APP_ID="your-facebook-app-id" \
    FACEBOOK_APP_SECRET="your-facebook-app-secret" \
    FACEBOOK_REDIRECT_URI="https://scorepaster-app.azurewebsites.net/api/auth/facebook/callback" \
    MICROSOFT_CLIENT_ID="your-microsoft-client-id" \
    MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret" \
    MICROSOFT_TENANT_ID="your-tenant-id" \
    MICROSOFT_REDIRECT_URI="https://scorepaster-app.azurewebsites.net/api/auth/microsoft/callback" \
    PORT=8080
```

## Step 3: Configure Startup Command

```bash
az webapp config set \
  --name scorepaster-app \
  --resource-group scorepaster-rg \
  --startup-file "node dist/index.js"
```

## Step 4: Deploy Application

### Option A: Using Azure CLI (Local Git)
```bash
cd server
az webapp deployment source config-local-git \
  --name scorepaster-app \
  --resource-group scorepaster-rg

git remote add azure <git-url-from-above>
git push azure main
```

### Option B: Using VS Code Azure Extension
1. Install "Azure App Service" extension
2. Right-click `server/` folder → Deploy to Web App
3. Select your App Service

### Option C: Using GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      - name: Build
        run: |
          npm install
          npm run build
      - name: Deploy
        uses: azure/webapps-deploy@v2
        with:
          app-name: scorepaster-app
          package: ./server
```

## Step 5: Update OAuth Redirect URIs

Update redirect URIs in each OAuth provider console:
- Google Cloud Console → APIs & Services → Credentials
- Facebook Developers → App Settings → Basic
- Azure Portal → Entra ID → App registrations → Your app → Authentication

Set redirect URIs to:
- `https://scorepaster-app.azurewebsites.net/api/auth/{provider}/callback`

## Step 6: Verify Deployment

1. Visit `https://scorepaster-app.azurewebsites.net`
2. Test login with each provider
3. Test score submission
4. Check Application Insights for logs and metrics

## Troubleshooting

### View Logs
```bash
az webapp log tail --name scorepaster-app --resource-group scorepaster-rg
```

### Check Application Settings
```bash
az webapp config appsettings list --name scorepaster-app --resource-group scorepaster-rg
```

### Restart App Service
```bash
az webapp restart --name scorepaster-app --resource-group scorepaster-rg
```