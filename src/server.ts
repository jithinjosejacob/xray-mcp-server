import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { XrayClient } from './xray/client.js';
import { registerTools } from './tools/index.js';

export class XrayMCPServer {
  private server: Server;
  private xrayClient: XrayClient;

  constructor(xrayClient: XrayClient) {
    this.xrayClient = xrayClient;
    this.server = new Server(
      {
        name: 'xray-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = registerTools();
      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'import_test_results':
            return await this.handleImportTestResults(args);

          case 'execute_tests':
            return await this.handleExecuteTests(args);

          case 'query_test_executions':
            return await this.handleQueryTestExecutions(args);

          case 'get_test_info':
            return await this.handleGetTestInfo(args);

          case 'create_test_execution':
            return await this.handleCreateTestExecution(args);

          case 'update_test_execution':
            return await this.handleUpdateTestExecution(args);

          case 'get_test_plans':
            return await this.handleGetTestPlans(args);

          case 'associate_tests_to_execution':
            return await this.handleAssociateTests(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleImportTestResults(args: any) {
    const { format, results, projectKey, testPlanKey, testEnvironments, testExecKey } = args;

    const options = {
      projectKey,
      testPlanKey,
      testEnvironments,
      testExecKey,
    };

    let result;
    switch (format) {
      case 'junit':
        result = await this.xrayClient.importJUnit(results, options);
        break;
      case 'cucumber':
        result = await this.xrayClient.importCucumber(results, options);
        break;
      case 'xray-json':
        result = await this.xrayClient.importXrayJson(results, options);
        break;
      case 'robot':
        result = await this.xrayClient.importRobot(results, options);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleExecuteTests(args: any) {
    const { testKeys, testPlanKey, testEnvironments, summary, description } = args;

    const result = await this.xrayClient.executeTests(testKeys, {
      testPlanKey,
      testEnvironments,
      summary,
      description,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Test execution created successfully:\n\nExecution Key: ${result.executionKey}\nSummary: ${result.summary}\nTests: ${result.tests.join(', ')}`,
        },
      ],
    };
  }

  private async handleQueryTestExecutions(args: any) {
    const { projectKey, testPlanKey, status, startDate, endDate, limit } = args;

    const executions = await this.xrayClient.queryExecutions({
      projectKey,
      testPlanKey,
      status,
      startDate,
      endDate,
      limit,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Found ${executions.length} test executions:\n\n${JSON.stringify(executions, null, 2)}`,
        },
      ],
    };
  }

  private async handleGetTestInfo(args: any) {
    const { testKey } = args;
    const test = await this.xrayClient.getTest(testKey);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(test, null, 2),
        },
      ],
    };
  }

  private async handleCreateTestExecution(args: any) {
    const { projectKey, summary, description, testPlanKey, testEnvironments } = args;

    const result = await this.xrayClient.createTestExecution(projectKey, summary, {
      description,
      testPlanKey,
      testEnvironments,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Test execution created:\n\nKey: ${result.executionKey}\nSummary: ${result.summary}`,
        },
      ],
    };
  }

  private async handleUpdateTestExecution(args: any) {
    const { executionKey, testKey, status, comment, defects } = args;

    await this.xrayClient.updateTestRun(executionKey, testKey, {
      status,
      comment,
      defects,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Test ${testKey} in execution ${executionKey} updated to status: ${status}`,
        },
      ],
    };
  }

  private async handleGetTestPlans(args: any) {
    const { projectKey, limit } = args;

    const executions = await this.xrayClient.queryExecutions({
      projectKey,
      limit: limit || 50,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(executions, null, 2),
        },
      ],
    };
  }

  private async handleAssociateTests(args: any) {
    const { executionKey, testKeys } = args;

    await this.xrayClient.associateTestsToExecution(executionKey, testKeys);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully associated ${testKeys.length} tests to execution ${executionKey}`,
        },
      ],
    };
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('Xray MCP Server running on stdio');
  }
}
