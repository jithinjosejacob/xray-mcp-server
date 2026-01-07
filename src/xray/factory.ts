import { XrayConfig, isCloudConfig, isServerConfig } from '../config/types.js';
import { XrayClient } from './client.js';
import { XrayCloudClient } from './cloud-client.js';
import { XrayServerClient } from './server-client.js';

export function createXrayClient(config: XrayConfig): XrayClient {
  if (isCloudConfig(config)) {
    return new XrayCloudClient(config.clientId, config.clientSecret);
  } else if (isServerConfig(config)) {
    if (config.authType === 'token') {
      return new XrayServerClient(config.jiraBaseUrl, config.token);
    } else {
      return new XrayServerClient(config.jiraBaseUrl, {
        username: config.username,
        password: config.password,
      });
    }
  }

  throw new Error('Invalid configuration: unable to create Xray client');
}
