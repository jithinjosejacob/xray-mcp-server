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

export interface XrayClient {
  executeTests(testKeys: string[], options: ExecutionOptions): Promise<ExecutionResult>;

  getTestExecution(executionKey: string): Promise<TestExecution>;

  updateTestRun(
    executionKey: string,
    testKey: string,
    data: UpdateTestRunData
  ): Promise<void>;

  importJUnit(xml: string, options: ImportOptions): Promise<ImportResult>;

  importCucumber(json: string, options: ImportOptions): Promise<ImportResult>;

  importXrayJson(json: string, options: ImportOptions): Promise<ImportResult>;

  importRobot(xml: string, options: ImportOptions): Promise<ImportResult>;

  queryExecutions(filters: ExecutionFilters): Promise<TestExecution[]>;

  getTest(testKey: string): Promise<Test>;

  getTestPlan(planKey: string): Promise<TestPlan>;

  createTestExecution(
    projectKey: string,
    summary: string,
    options?: Partial<ExecutionOptions>
  ): Promise<ExecutionResult>;

  associateTestsToExecution(executionKey: string, testKeys: string[]): Promise<void>;
}
