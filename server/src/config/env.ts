import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: resolve(currentDir, '../../.env')
});

const DEVELOPMENT_PLACEHOLDER_VALUES = new Set([
  'replace-with-a-secure-secret',
  'replace-with-your-jwt-secret',
  'changeme',
  'change-me',
  'secret',
  'jwt-secret'
]);

function getEnvValue(name: string) {
  return process.env[name]?.trim();
}

function requireProductionEnv(name: string) {
  const value = getEnvValue(name);

  if (!value) {
    throw new Error(`${name} must be configured in production`);
  }

  return value;
}

function validateProductionEnvironment() {
  requireProductionEnv('MONGODB_URI');
  requireProductionEnv('CLIENT_URL');

  const jwtSecret = requireProductionEnv('JWT_SECRET');

  if (DEVELOPMENT_PLACEHOLDER_VALUES.has(jwtSecret.toLowerCase())) {
    throw new Error('JWT_SECRET must use a secure production value');
  }

  const aiProvider = requireProductionEnv('AI_PROVIDER').toLowerCase();

  if (aiProvider !== 'openai' && aiProvider !== 'ollama') {
    throw new Error('AI_PROVIDER must be either "openai" or "ollama"');
  }

  if (aiProvider === 'openai') {
    const openAiKey = requireProductionEnv('OPENAI_API_KEY');

    if (openAiKey === 'replace-with-your-openai-api-key') {
      throw new Error('OPENAI_API_KEY must use a production value when AI_PROVIDER=openai');
    }
  }

  if (aiProvider === 'ollama') {
    requireProductionEnv('OLLAMA_BASE_URL');
    requireProductionEnv('OLLAMA_MODEL');
  }
}

if (process.env.NODE_ENV === 'production') {
  validateProductionEnvironment();
}
