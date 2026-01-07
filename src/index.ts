#!/usr/bin/env node

import { loadConfigFromEnv } from './config/validator.js';
import { createXrayClient } from './xray/factory.js';
import { XrayMCPServer } from './server.js';

async function main() {
  try {
    // Load and validate configuration
    const config = loadConfigFromEnv();

    // Create Xray client
    const xrayClient = createXrayClient(config);

    // Create and start MCP server
    const server = new XrayMCPServer(xrayClient);
    await server.start();
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to start Xray MCP Server:', error.message);
    } else {
      console.error('Failed to start Xray MCP Server:', error);
    }
    process.exit(1);
  }
}

main();
