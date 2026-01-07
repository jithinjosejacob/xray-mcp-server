import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function registerTools(): Tool[] {
  return [
    {
      name: 'import_test_results',
      description: 'Import automated test execution results from various formats (JUnit, Cucumber, Xray JSON, Robot Framework, TestNG)',
      inputSchema: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['junit', 'cucumber', 'xray-json', 'robot', 'testng'],
            description: 'Format of the test results to import',
          },
          results: {
            type: 'string',
            description: 'Test results content as XML or JSON string',
          },
          projectKey: {
            type: 'string',
            description: 'Jira project key (e.g., "PROJ")',
          },
          testPlanKey: {
            type: 'string',
            description: 'Optional: Test plan key to associate results with (e.g., "PROJ-123")',
          },
          testEnvironments: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional: Test environments (e.g., ["Chrome", "Production"])',
          },
          testExecKey: {
            type: 'string',
            description: 'Optional: Existing test execution key to update',
          },
        },
        required: ['format', 'results', 'projectKey'],
      },
    },
    {
      name: 'execute_tests',
      description: 'Create and execute a test run in Xray for specified test cases',
      inputSchema: {
        type: 'object',
        properties: {
          testKeys: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of test issue keys (e.g., ["PROJ-123", "PROJ-124"])',
          },
          testPlanKey: {
            type: 'string',
            description: 'Optional: Test plan key to associate execution with',
          },
          testEnvironments: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional: Test environments (e.g., ["Chrome", "Production"])',
          },
          summary: {
            type: 'string',
            description: 'Optional: Summary/title for the test execution',
          },
          description: {
            type: 'string',
            description: 'Optional: Detailed description of the test execution',
          },
        },
        required: ['testKeys'],
      },
    },
    {
      name: 'query_test_executions',
      description: 'Query and filter test executions in Xray',
      inputSchema: {
        type: 'object',
        properties: {
          projectKey: {
            type: 'string',
            description: 'Jira project key',
          },
          testPlanKey: {
            type: 'string',
            description: 'Optional: Filter by test plan key',
          },
          status: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['PASS', 'FAIL', 'EXECUTING', 'TODO', 'ABORTED'],
            },
            description: 'Optional: Filter by execution status',
          },
          startDate: {
            type: 'string',
            description: 'Optional: Filter executions created after this date (ISO 8601 format)',
          },
          endDate: {
            type: 'string',
            description: 'Optional: Filter executions created before this date (ISO 8601 format)',
          },
          limit: {
            type: 'number',
            description: 'Optional: Maximum number of results to return (default: 50)',
          },
        },
        required: ['projectKey'],
      },
    },
    {
      name: 'get_test_info',
      description: 'Retrieve detailed information about a specific test case',
      inputSchema: {
        type: 'object',
        properties: {
          testKey: {
            type: 'string',
            description: 'Test issue key (e.g., "PROJ-123")',
          },
        },
        required: ['testKey'],
      },
    },
    {
      name: 'create_test_execution',
      description: 'Create a new test execution container in Xray',
      inputSchema: {
        type: 'object',
        properties: {
          projectKey: {
            type: 'string',
            description: 'Jira project key',
          },
          summary: {
            type: 'string',
            description: 'Execution summary/title',
          },
          description: {
            type: 'string',
            description: 'Optional: Detailed description',
          },
          testPlanKey: {
            type: 'string',
            description: 'Optional: Test plan key to associate with',
          },
          testEnvironments: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional: Execution environments',
          },
        },
        required: ['projectKey', 'summary'],
      },
    },
    {
      name: 'update_test_execution',
      description: 'Update status and details of a test within an execution',
      inputSchema: {
        type: 'object',
        properties: {
          executionKey: {
            type: 'string',
            description: 'Test execution key (e.g., "PROJ-456")',
          },
          testKey: {
            type: 'string',
            description: 'Test key to update (e.g., "PROJ-123")',
          },
          status: {
            type: 'string',
            enum: ['PASS', 'FAIL', 'EXECUTING', 'TODO', 'ABORTED'],
            description: 'Test status',
          },
          comment: {
            type: 'string',
            description: 'Optional: Comment about the execution',
          },
          defects: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional: Associated defect keys',
          },
        },
        required: ['executionKey', 'testKey', 'status'],
      },
    },
    {
      name: 'get_test_plans',
      description: 'List test plans in a project',
      inputSchema: {
        type: 'object',
        properties: {
          projectKey: {
            type: 'string',
            description: 'Jira project key',
          },
          limit: {
            type: 'number',
            description: 'Optional: Maximum number of results (default: 50)',
          },
        },
        required: ['projectKey'],
      },
    },
    {
      name: 'associate_tests_to_execution',
      description: 'Add test cases to an existing test execution',
      inputSchema: {
        type: 'object',
        properties: {
          executionKey: {
            type: 'string',
            description: 'Test execution key',
          },
          testKeys: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of test keys to add',
          },
        },
        required: ['executionKey', 'testKeys'],
      },
    },
  ];
}
