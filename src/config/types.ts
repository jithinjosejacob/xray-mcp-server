export type DeploymentType = 'cloud' | 'server';
export type AuthType = 'basic' | 'token';

export interface CloudConfig {
  deployment: 'cloud';
  clientId: string;
  clientSecret: string;
  defaultProject?: string;
}

export interface ServerConfigWithToken {
  deployment: 'server';
  jiraBaseUrl: string;
  authType: 'token';
  token: string;
  defaultProject?: string;
}

export interface ServerConfigWithBasic {
  deployment: 'server';
  jiraBaseUrl: string;
  authType: 'basic';
  username: string;
  password: string;
  defaultProject?: string;
}

export type ServerConfig = ServerConfigWithToken | ServerConfigWithBasic;
export type XrayConfig = CloudConfig | ServerConfig;

export function isCloudConfig(config: XrayConfig): config is CloudConfig {
  return config.deployment === 'cloud';
}

export function isServerConfig(config: XrayConfig): config is ServerConfig {
  return config.deployment === 'server';
}
