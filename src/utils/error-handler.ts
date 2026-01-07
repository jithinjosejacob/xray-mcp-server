import axios, { AxiosError } from 'axios';

export class XrayError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'XrayError';
    Object.setPrototypeOf(this, XrayError.prototype);
  }
}

export function handleXrayApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const status = axiosError.response.status;
      const data = axiosError.response.data;

      let message = 'Xray API request failed';
      let code = 'API_ERROR';

      if (status === 401 || status === 403) {
        message = 'Authentication failed. Please check your credentials.';
        code = 'AUTH_FAILED';
      } else if (status === 404) {
        message = 'Resource not found. Please check the issue key or test ID.';
        code = 'NOT_FOUND';
      } else if (status === 400) {
        message = 'Invalid request. Please check your input parameters.';
        code = 'INVALID_REQUEST';
        if (typeof data === 'object' && data !== null) {
          const errorData = data as Record<string, unknown>;
          if (errorData.error || errorData.errorMessages || errorData.message) {
            message = `Invalid request: ${JSON.stringify(errorData)}`;
          }
        }
      } else if (status === 429) {
        message = 'Rate limit exceeded. Please try again later.';
        code = 'RATE_LIMIT';
      } else if (status >= 500) {
        message = 'Xray server error. Please try again later.';
        code = 'SERVER_ERROR';
      }

      throw new XrayError(message, code, status, data);
    } else if (axiosError.request) {
      throw new XrayError(
        'Network error: Unable to reach Xray API. Please check your connection and base URL.',
        'NETWORK_ERROR',
        undefined,
        axiosError.message
      );
    }
  }

  if (error instanceof XrayError) {
    throw error;
  }

  if (error instanceof Error) {
    throw new XrayError(
      error.message,
      'UNKNOWN_ERROR',
      undefined,
      error
    );
  }

  throw new XrayError(
    'An unknown error occurred',
    'UNKNOWN_ERROR',
    undefined,
    error
  );
}

export function validateTestKey(key: string): void {
  const testKeyPattern = /^[A-Z][A-Z0-9]+-\d+$/;
  if (!testKeyPattern.test(key)) {
    throw new XrayError(
      `Invalid test key format: "${key}". Expected format: PROJECT-123`,
      'INVALID_INPUT'
    );
  }
}

export function validateProjectKey(key: string): void {
  const projectKeyPattern = /^[A-Z][A-Z0-9]+$/;
  if (!projectKeyPattern.test(key)) {
    throw new XrayError(
      `Invalid project key format: "${key}". Expected format: PROJECT`,
      'INVALID_INPUT'
    );
  }
}
