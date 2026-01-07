import { z } from 'zod';
import dotenv from 'dotenv';
import { XrayConfig } from './types.js';

dotenv.config();

const CloudConfigSchema = z.object({
  deployment: z.literal('cloud'),
  clientId: z.string().min(1, 'XRAY_CLOUD_CLIENT_ID is required for cloud deployment'),
  clientSecret: z.string().min(1, 'XRAY_CLOUD_CLIENT_SECRET is required for cloud deployment'),
  defaultProject: z.string().optional(),
});

const ServerConfigWithTokenSchema = z.object({
  deployment: z.literal('server'),
  jiraBaseUrl: z.string().url('XRAY_JIRA_BASE_URL must be a valid URL'),
  authType: z.literal('token'),
  token: z.string().min(1, 'XRAY_TOKEN is required when using token authentication'),
  defaultProject: z.string().optional(),
});

const ServerConfigWithBasicSchema = z.object({
  deployment: z.literal('server'),
  jiraBaseUrl: z.string().url('XRAY_JIRA_BASE_URL must be a valid URL'),
  authType: z.literal('basic'),
  username: z.string().min(1, 'XRAY_USERNAME is required when using basic authentication'),
  password: z.string().min(1, 'XRAY_PASSWORD is required when using basic authentication'),
  defaultProject: z.string().optional(),
});

const XrayConfigSchema = z.union([
  CloudConfigSchema,
  ServerConfigWithTokenSchema,
  ServerConfigWithBasicSchema,
]);

export function validateConfig(config: unknown): XrayConfig {
  try {
    return XrayConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `  - ${err.path.join('.')}: ${err.message}`).join('\n');
      throw new Error(`Configuration validation failed:\n${messages}`);
    }
    throw error;
  }
}

export function loadConfigFromEnv(): XrayConfig {
  const deployment = process.env.XRAY_DEPLOYMENT;

  if (!deployment) {
    throw new Error(
      'XRAY_DEPLOYMENT environment variable is required. Set it to "cloud" or "server".\n' +
      'See .env.example for configuration template.'
    );
  }

  if (deployment !== 'cloud' && deployment !== 'server') {
    throw new Error(
      `Invalid XRAY_DEPLOYMENT value: "${deployment}". Must be "cloud" or "server".`
    );
  }

  const defaultProject = process.env.XRAY_DEFAULT_PROJECT;

  if (deployment === 'cloud') {
    const config = {
      deployment: 'cloud' as const,
      clientId: process.env.XRAY_CLOUD_CLIENT_ID || '',
      clientSecret: process.env.XRAY_CLOUD_CLIENT_SECRET || '',
      defaultProject,
    };
    return validateConfig(config);
  } else {
    const authType = process.env.XRAY_AUTH_TYPE;

    if (!authType || (authType !== 'token' && authType !== 'basic')) {
      throw new Error(
        'XRAY_AUTH_TYPE must be set to "token" or "basic" for server deployment.'
      );
    }

    if (authType === 'token') {
      const config = {
        deployment: 'server' as const,
        jiraBaseUrl: process.env.XRAY_JIRA_BASE_URL || '',
        authType: 'token' as const,
        token: process.env.XRAY_TOKEN || '',
        defaultProject,
      };
      return validateConfig(config);
    } else {
      const config = {
        deployment: 'server' as const,
        jiraBaseUrl: process.env.XRAY_JIRA_BASE_URL || '',
        authType: 'basic' as const,
        username: process.env.XRAY_USERNAME || '',
        password: process.env.XRAY_PASSWORD || '',
        defaultProject,
      };
      return validateConfig(config);
    }
  }
}
