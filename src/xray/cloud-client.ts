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

const XRAY_CLOUD_BASE_URL = 'https://xray.cloud.getxray.app/api/v2';
const TOKEN_EXPIRY_BUFFER = 60000; // 1 minute buffer

export class XrayCloudClient implements XrayClient {
  private axiosInstance: AxiosInstance;
  private clientId: string;
  private clientSecret: string;
  private authToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.axiosInstance = axios.create({
      baseURL: XRAY_CLOUD_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to ensure valid auth token
    this.axiosInstance.interceptors.request.use(async (config) => {
      await this.ensureValidToken();
      config.headers.Authorization = `Bearer ${this.authToken}`;
      return config;
    });
  }

  private async ensureValidToken(): Promise<void> {
    const now = new Date();

    if (
      this.authToken &&
      this.tokenExpiry &&
      this.tokenExpiry.getTime() - now.getTime() > TOKEN_EXPIRY_BUFFER
    ) {
      return;
    }

    await this.authenticate();
  }

  private async authenticate(): Promise<void> {
    try {
      const response = await axios.post(
        `${XRAY_CLOUD_BASE_URL}/authenticate`,
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      this.authToken = response.data;
      // Tokens typically expire in 15 minutes, set expiry to 14 minutes from now
      this.tokenExpiry = new Date(Date.now() + 14 * 60 * 1000);
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async executeTests(testKeys: string[], options: ExecutionOptions): Promise<ExecutionResult> {
    try {
      const response = await this.axiosInstance.post('/graphql', {
        query: `
          mutation CreateTestExecution($input: CreateTestExecutionInput!) {
            createTestExecution(input: $input) {
              testExecution {
                issueId
                jira(fields: ["key", "summary"])
              }
              createdTestRuns {
                issueId
              }
            }
          }
        `,
        variables: {
          input: {
            testIssueIds: testKeys,
            testEnvironments: options.testEnvironments,
            testPlanIssueId: options.testPlanKey,
            summary: options.summary,
            description: options.description,
          },
        },
      });

      const data = response.data.data.createTestExecution;
      return {
        executionKey: data.testExecution.jira.key,
        id: data.testExecution.issueId,
        summary: data.testExecution.jira.summary,
        tests: testKeys,
      };
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async getTestExecution(executionKey: string): Promise<TestExecution> {
    try {
      const response = await this.axiosInstance.post('/graphql', {
        query: `
          query GetTestExecution($issueId: String!) {
            getTestExecution(issueId: $issueId) {
              issueId
              jira(fields: ["key", "summary", "status"])
              testRuns {
                nodes {
                  test {
                    issueId
                    jira(fields: ["key"])
                  }
                  status {
                    name
                  }
                  comment
                }
              }
            }
          }
        `,
        variables: {
          issueId: executionKey,
        },
      });

      const data = response.data.data.getTestExecution;
      return {
        key: data.jira.key,
        id: data.issueId,
        summary: data.jira.summary,
        status: data.jira.status?.name,
        tests: data.testRuns.nodes.map((run: any) => ({
          key: run.test.jira.key,
          status: run.status.name,
          comment: run.comment,
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
      await this.axiosInstance.post('/graphql', {
        query: `
          mutation UpdateTestRunStatus($input: UpdateTestRunStatusInput!) {
            updateTestRunStatus(input: $input)
          }
        `,
        variables: {
          input: {
            testExecIssueId: executionKey,
            testIssueId: testKey,
            status: data.status,
            comment: data.comment,
          },
        },
      });
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async importJUnit(xml: string, options: ImportOptions): Promise<ImportResult> {
    try {
      const params: Record<string, string> = {
        projectKey: options.projectKey,
      };

      if (options.testPlanKey) params.testPlanKey = options.testPlanKey;
      if (options.testEnvironments?.length) {
        params.testEnvironments = options.testEnvironments.join(';');
      }
      if (options.testExecKey) params.testExecKey = options.testExecKey;
      if (options.revision) params.revision = options.revision;
      if (options.fixVersion) params.fixVersion = options.fixVersion;

      const response = await this.axiosInstance.post(
        '/import/execution/junit',
        xml,
        {
          params,
          headers: {
            'Content-Type': 'application/xml',
          },
        }
      );

      return response.data;
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async importCucumber(json: string, options: ImportOptions): Promise<ImportResult> {
    try {
      const params: Record<string, string> = {
        projectKey: options.projectKey,
      };

      if (options.testPlanKey) params.testPlanKey = options.testPlanKey;
      if (options.testEnvironments?.length) {
        params.testEnvironments = options.testEnvironments.join(';');
      }
      if (options.testExecKey) params.testExecKey = options.testExecKey;
      if (options.revision) params.revision = options.revision;
      if (options.fixVersion) params.fixVersion = options.fixVersion;

      const response = await this.axiosInstance.post(
        '/import/execution/cucumber',
        json,
        {
          params,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async importXrayJson(json: string, options: ImportOptions): Promise<ImportResult> {
    try {
      const response = await this.axiosInstance.post(
        '/import/execution',
        json,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async importRobot(xml: string, options: ImportOptions): Promise<ImportResult> {
    try {
      const params: Record<string, string> = {
        projectKey: options.projectKey,
      };

      if (options.testPlanKey) params.testPlanKey = options.testPlanKey;
      if (options.testEnvironments?.length) {
        params.testEnvironments = options.testEnvironments.join(';');
      }

      const response = await this.axiosInstance.post(
        '/import/execution/robot',
        xml,
        {
          params,
          headers: {
            'Content-Type': 'application/xml',
          },
        }
      );

      return response.data;
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async queryExecutions(filters: ExecutionFilters): Promise<TestExecution[]> {
    try {
      const response = await this.axiosInstance.post('/graphql', {
        query: `
          query GetTestExecutions($jql: String!, $limit: Int) {
            getTestExecutions(jql: $jql, limit: $limit) {
              total
              results {
                issueId
                jira(fields: ["key", "summary", "created"])
              }
            }
          }
        `,
        variables: {
          jql: this.buildJqlQuery(filters),
          limit: filters.limit || 50,
        },
      });

      const results = response.data.data.getTestExecutions.results;
      return results.map((exec: any) => ({
        key: exec.jira.key,
        id: exec.issueId,
        summary: exec.jira.summary,
      }));
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  private buildJqlQuery(filters: ExecutionFilters): string {
    const conditions: string[] = [
      `project = ${filters.projectKey}`,
      'type = "Test Execution"',
    ];

    if (filters.testPlanKey) {
      conditions.push(`issue in testPlan(${filters.testPlanKey})`);
    }

    if (filters.startDate) {
      conditions.push(`created >= "${filters.startDate}"`);
    }

    if (filters.endDate) {
      conditions.push(`created <= "${filters.endDate}"`);
    }

    return conditions.join(' AND ');
  }

  async getTest(testKey: string): Promise<Test> {
    try {
      const response = await this.axiosInstance.post('/graphql', {
        query: `
          query GetTest($issueId: String!) {
            getTest(issueId: $issueId) {
              issueId
              jira(fields: ["key", "summary", "labels"])
              testType {
                name
              }
            }
          }
        `,
        variables: {
          issueId: testKey,
        },
      });

      const data = response.data.data.getTest;
      return {
        key: data.jira.key,
        id: data.issueId,
        summary: data.jira.summary,
        type: data.testType.name,
        labels: data.jira.labels,
      };
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async getTestPlan(planKey: string): Promise<TestPlan> {
    try {
      const response = await this.axiosInstance.post('/graphql', {
        query: `
          query GetTestPlan($issueId: String!) {
            getTestPlan(issueId: $issueId) {
              issueId
              jira(fields: ["key", "summary"])
              tests {
                total
              }
            }
          }
        `,
        variables: {
          issueId: planKey,
        },
      });

      const data = response.data.data.getTestPlan;
      return {
        key: data.jira.key,
        id: data.issueId,
        summary: data.jira.summary,
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
      const response = await this.axiosInstance.post('/graphql', {
        query: `
          mutation CreateTestExecution($input: CreateTestExecutionInput!) {
            createTestExecution(input: $input) {
              testExecution {
                issueId
                jira(fields: ["key", "summary"])
              }
            }
          }
        `,
        variables: {
          input: {
            projectKey,
            summary,
            description: options?.description,
            testEnvironments: options?.testEnvironments,
            testPlanIssueId: options?.testPlanKey,
          },
        },
      });

      const data = response.data.data.createTestExecution.testExecution;
      return {
        executionKey: data.jira.key,
        id: data.issueId,
        summary: data.jira.summary,
        tests: [],
      };
    } catch (error) {
      handleXrayApiError(error);
    }
  }

  async associateTestsToExecution(executionKey: string, testKeys: string[]): Promise<void> {
    try {
      await this.axiosInstance.post('/graphql', {
        query: `
          mutation AddTestsToTestExecution($input: AddTestsToTestExecutionInput!) {
            addTestsToTestExecution(input: $input) {
              addedTests
            }
          }
        `,
        variables: {
          input: {
            testExecIssueId: executionKey,
            testIssueIds: testKeys,
          },
        },
      });
    } catch (error) {
      handleXrayApiError(error);
    }
  }
}
