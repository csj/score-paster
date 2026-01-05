import * as appInsights from 'applicationinsights';

export function initializeAppInsights() {
  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
  
  if (!connectionString) {
    console.warn('Application Insights connection string not found. Telemetry disabled.');
    return;
  }

  appInsights.setup(connectionString)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, true)
    .setUseDiskRetryCaching(true)
    .start();

  console.log('Application Insights initialized');
}

export function trackEvent(name: string, properties?: Record<string, string>) {
  const client = appInsights.defaultClient;
  if (client) {
    client.trackEvent({ name, properties });
  }
}

export function trackMetric(name: string, value: number) {
  const client = appInsights.defaultClient;
  if (client) {
    client.trackMetric({ name, value });
  }
}

export function logInfo(message: string, properties?: Record<string, string>) {
  const client = appInsights.defaultClient;
  if (client) {
    client.trackTrace({ message, severity: appInsights.Contracts.SeverityLevel.Information, properties });
  }
  console.log(message, properties);
}

export function logWarning(message: string, properties?: Record<string, string>) {
  const client = appInsights.defaultClient;
  if (client) {
    client.trackTrace({ message, severity: appInsights.Contracts.SeverityLevel.Warning, properties });
  }
  console.warn(message, properties);
}

export function logError(error: Error | string, properties?: Record<string, string>) {
  const client = appInsights.defaultClient;
  if (client) {
    if (error instanceof Error) {
      client.trackException({ exception: error, properties });
    } else {
      client.trackTrace({ message: error, severity: appInsights.Contracts.SeverityLevel.Error, properties });
    }
  }
  console.error(error, properties);
}