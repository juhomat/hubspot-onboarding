import { ApplicationFramework } from '@juhomat/hexagonal-ai-framework';
import { FrameworkConfigBuilder } from '@juhomat/hexagonal-ai-framework';

// Load environment variables
if (typeof window === 'undefined') {
  require('dotenv').config();
}

/**
 * Get database configuration for the framework
 */
export function getDatabaseConfig() {
  // Always provide the required fields for the DatabaseConfig type
  const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'hubspot_onboarding',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20')
  };

  // For Heroku deployment, if DATABASE_URL is available, parse it
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      return {
        ...baseConfig,
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1), // Remove leading /
        username: url.username,
        password: url.password,
        ssl: process.env.NODE_ENV === 'production'
      };
    } catch (error) {
      console.warn('Failed to parse DATABASE_URL, using fallback config');
    }
  }
  
  return baseConfig;
}

/**
 * Create and initialize the ApplicationFramework with database configuration
 */
export async function createFramework(): Promise<ApplicationFramework> {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  
  const config = new FrameworkConfigBuilder()
    .environment(env)
    .debug(process.env.NODE_ENV !== 'production')
    .database(getDatabaseConfig())
    .build();

  const framework = new ApplicationFramework(config);
  await framework.initialize();
  
  return framework;
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const framework = await createFramework();
    const isHealthy = await framework.isDatabaseHealthy();
    await framework.dispose();
    return isHealthy;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
} 