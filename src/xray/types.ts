export interface Test {
  key: string;
  id: string;
  summary: string;
  type: string;
  status?: string;
  labels?: string[];
}

export interface TestExecution {
  key: string;
  id: string;
  summary: string;
  status?: string;
  testEnvironments?: string[];
  testPlanKey?: string;
  tests?: TestRun[];
  startDate?: string;
  endDate?: string;
}

export interface TestRun {
  key: string;
  status: 'PASS' | 'FAIL' | 'EXECUTING' | 'TODO' | 'ABORTED';
  comment?: string;
  defects?: string[];
  duration?: number;
}

export interface TestPlan {
  key: string;
  id: string;
  summary: string;
  tests?: string[];
}

export interface ExecutionOptions {
  testPlanKey?: string;
  testEnvironments?: string[];
  summary?: string;
  description?: string;
}

export interface ImportOptions {
  projectKey: string;
  testPlanKey?: string;
  testEnvironments?: string[];
  autoCreateTests?: boolean;
  testExecKey?: string;
  revision?: string;
  fixVersion?: string;
}

export interface ImportResult {
  testExecIssue?: {
    id: string;
    key: string;
    self: string;
  };
  testIssues?: {
    id: string;
    key: string;
    self: string;
  }[];
  infoMessages?: string[];
  errorMessages?: string[];
}

export interface ExecutionResult {
  executionKey: string;
  id: string;
  summary: string;
  tests: string[];
}

export interface ExecutionFilters {
  projectKey: string;
  testPlanKey?: string;
  status?: ('PASS' | 'FAIL' | 'EXECUTING' | 'TODO' | 'ABORTED')[];
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface UpdateTestRunData {
  status: 'PASS' | 'FAIL' | 'EXECUTING' | 'TODO' | 'ABORTED';
  comment?: string;
  defects?: string[];
  duration?: number;
  actualResult?: string;
}

export type TestResultFormat = 'junit' | 'cucumber' | 'xray-json' | 'robot' | 'testng';
