import axios, { AxiosInstance } from 'axios';
import { XrayClient } from './client.js';
import {
  Test,
  TestExecution,
  TestPlan,
  ExecutionOptions,
  ExecutionResult,
  ExecutionFilters,
  ImportOptions,
  ImportResult,
  UpdateTestRunData,
} from './types.js';
import { handleXrayApiError } from '../utils/error-handler.js';

interface JiraAuthConfig {
  username: string;
  password: string;
}

export class XrayServerClient implements XrayClient {
  private axiosInstance: AxiosInstance;
  private jiraInstance: AxiosInstance;

  constructor(jiraBaseUrl: string, auth: string | JiraAuthConfig) {
    const xrayBaseUrl = `${jiraBaseUrl}/rest/raven/1.0/api`;
    const jiraApiUrl = `${jiraBaseUrl}/rest/api/2`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let authConfig: { headers: Record<string, string> } = { headers };

    if (typeof auth === 'string') {
      // Personal Access Token
      headers.Authorization = `Bearer ${auth}`;
    } else {
      // Basic Authentication
      const basicAuth = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
      headers.Authorization = `Basic ${basicAuth}`;
    }

    this.axiosInstance = axios.create({
      baseURL: xrayBaseUrl,
      headers,
    });

    this.jiraInstance = axios.create({
      baseURL: jiraApiUrl,
      headers,
    });
  }

  async executeTests(testKeys: string[], options: ExecutionOptions): Promise<ExecutionResult> {
    try {
      // Create test execution issue first
      const testExecData: any = {
        fields: {
          project: {
            key: testKeys[0].split('-')[0], // Extract project key from test key
          },
          summary: options.summary || `Test Execution - ${new Date().toISOString()}`,
          issuetype: {
            name: 'Test Execution',
          },
        },
      };

      if (options.description) {
        testExecData.fields.description = options.description;
      }

      const createResponse = await this.jiraInstance.post('/issue', testExecData);
      const executionKey = createResponse.data.key;
      const executionId = createResponse.data.id;

      // Associate tests with the execution
      await this.axiosInstance.post(`/testexec/${executionKey}/test`, {
        add: testKeys,
      });

      // Set test environments if provided
      if (options.testEnvironments && options.testEnvironments.length > 0) {
        await this.jiraInstance.put(`/issue/${executionKey}`, {
          fields: {
            customfield_testEnvironments: options.testEnvironments,
          },
        });
      }

      // Associate with test plan if provided
      if (options.testPlanKey) {
        await this.axiosInstance.post(`/testplan/${options.testPlanKey}/testexecution`, {
          add: [executionKey],
        });
      }

      return {
        executionKey,
        id: executionId,
        summary: testExecData.fields.summary,
        tests: testKeys,
      };
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async getTestExecution(executionKey: string): Promise<TestExecution> {
    try {
      const [issueResponse, testsResponse] = await Promise.all([
        this.jiraInstance.get(`/issue/${executionKey}`),
        this.axiosInstance.get(`/testexec/${executionKey}/test`),
      ]);

      const issue = issueResponse.data;
      const tests = testsResponse.data;

      return {
        key: issue.key,
        id: issue.id,
        summary: issue.fields.summary,
        status: issue.fields.status?.name,
        testEnvironments: issue.fields.customfield_testEnvironments,
        tests: tests.map((test: any) => ({
          key: test.key,
          status: test.status,
        })),
      };
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async updateTestRun(
    executionKey: string,
    testKey: string,
    data: UpdateTestRunData
  ): Promise<void> {
    try {
      await this.axiosInstance.post(`/testexec/${executionKey}/test`, {
        testKey,
        status: data.status,
        comment: data.comment,
        defects: data.defects,
      });
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async importJUnit(xml: string, options: ImportOptions): Promise<ImportResult> {
    try {
      const info: any = {
        fields: {
          project: {
            key: options.projectKey,
          },
          summary: `Test Execution - ${new Date().toISOString()}`,
          issuetype: {
            name: 'Test Execution',
          },
        },
      };

      if (options.testEnvironments && options.testEnvironments.length > 0) {
        info.fields.testEnvironments = options.testEnvironments;
      }

      if (options.testPlanKey) {
        info.fields.testPlanKey = options.testPlanKey;
      }

      if (options.fixVersion) {
        info.fields.fixVersions = [{ name: options.fixVersion }];
      }

      const params: Record<string, string> = {
        projectKey: options.projectKey,
      };

      if (options.testExecKey) {
        params.testExecKey = options.testExecKey;
      }

      const response = await this.axiosInstance.post('/import/execution/junit', xml, {
        params,
        headers: {
          'Content-Type': 'application/xml',
        },
      });

      return response.data;
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async importCucumber(json: string, options: ImportOptions): Promise<ImportResult> {
    try {
      const info: any = {
        fields: {
          project: {
            key: options.projectKey,
          },
          summary: `Test Execution - ${new Date().toISOString()}`,
          issuetype: {
            name: 'Test Execution',
          },
        },
      };

      if (options.testEnvironments && options.testEnvironments.length > 0) {
        info.fields.testEnvironments = options.testEnvironments;
      }

      if (options.testPlanKey) {
        info.fields.testPlanKey = options.testPlanKey;
      }

      const payload = {
        info: JSON.stringify(info),
        result: json,
      };

      const response = await this.axiosInstance.post('/import/execution/cucumber', payload);

      return response.data;
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async importXrayJson(json: string, options: ImportOptions): Promise<ImportResult> {
    try {
      const response = await this.axiosInstance.post('/import/execution', json, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async importRobot(xml: string, options: ImportOptions): Promise<ImportResult> {
    try {
      const info: any = {
        fields: {
          project: {
            key: options.projectKey,
          },
          summary: `Test Execution - ${new Date().toISOString()}`,
          issuetype: {
            name: 'Test Execution',
          },
        },
      };

      if (options.testEnvironments && options.testEnvironments.length > 0) {
        info.fields.testEnvironments = options.testEnvironments;
      }

      if (options.testPlanKey) {
        info.fields.testPlanKey = options.testPlanKey;
      }

      const payload = {
        info: JSON.stringify(info),
        result: xml,
      };

      const response = await this.axiosInstance.post('/import/execution/robot', payload);

      return response.data;
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async queryExecutions(filters: ExecutionFilters): Promise<TestExecution[]> {
    try {
      const jql = this.buildJqlQuery(filters);
      const response = await this.jiraInstance.get('/search', {
        params: {
          jql,
          maxResults: filters.limit || 50,
          fields: 'key,summary,status,created',
        },
      });

      return response.data.issues.map((issue: any) => ({
        key: issue.key,
        id: issue.id,
        summary: issue.fields.summary,
        status: issue.fields.status?.name,
      }));
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  private buildJqlQuery(filters: ExecutionFilters): string {
    const conditions: string[] = [
      `project = ${filters.projectKey}`,
      'issuetype = "Test Execution"',
    ];

    if (filters.testPlanKey) {
      conditions.push(`issue in testPlanTests("${filters.testPlanKey}")`);
    }

    if (filters.startDate) {
      conditions.push(`created >= "${filters.startDate}"`);
    }

    if (filters.endDate) {
      conditions.push(`created <= "${filters.endDate}"`);
    }

    return conditions.join(' AND ') + ' ORDER BY created DESC';
  }

  async getTest(testKey: string): Promise<Test> {
    try {
      const response = await this.jiraInstance.get(`/issue/${testKey}`);
      const issue = response.data;

      return {
        key: issue.key,
        id: issue.id,
        summary: issue.fields.summary,
        type: issue.fields.issuetype?.name || 'Test',
        status: issue.fields.status?.name,
        labels: issue.fields.labels,
      };
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async getTestPlan(planKey: string): Promise<TestPlan> {
    try {
      const [issueResponse, testsResponse] = await Promise.all([
        this.jiraInstance.get(`/issue/${planKey}`),
        this.axiosInstance.get(`/testplan/${planKey}/test`),
      ]);

      const issue = issueResponse.data;
      const tests = testsResponse.data;

      return {
        key: issue.key,
        id: issue.id,
        summary: issue.fields.summary,
        tests: tests.map((test: any) => test.key),
      };
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async createTestExecution(
    projectKey: string,
    summary: string,
    options?: Partial<ExecutionOptions>
  ): Promise<ExecutionResult> {
    try {
      const testExecData: any = {
        fields: {
          project: {
            key: projectKey,
          },
          summary,
          issuetype: {
            name: 'Test Execution',
          },
        },
      };

      if (options?.description) {
        testExecData.fields.description = options.description;
      }

      if (options?.testEnvironments && options.testEnvironments.length > 0) {
        testExecData.fields.customfield_testEnvironments = options.testEnvironments;
      }

      const response = await this.jiraInstance.post('/issue', testExecData);

      // Associate with test plan if provided
      if (options?.testPlanKey) {
        await this.axiosInstance.post(`/testplan/${options.testPlanKey}/testexecution`, {
          add: [response.data.key],
        });
      }

      return {
        executionKey: response.data.key,
        id: response.data.id,
        summary,
        tests: [],
      };
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async associateTestsToExecution(executionKey: string, testKeys: string[]): Promise<void> {
    try {
      await this.axiosInstance.post(`/testexec/${executionKey}/test`, {
        add: testKeys,
      });
    } catch (error) {
      handleXrayApiError(error);
    }
  }
}
