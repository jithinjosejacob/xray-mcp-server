# Xray MCP Server

A Model Context Protocol (MCP) server for integrating with Xray Test Management. This server enables AI assistants like Claude to interact with Xray, supporting test execution and importing test results from various formats.

## Features

- **Dual Deployment Support**: Works with both Xray Cloud and Xray Server/Data Center
- **Test Execution**: Create and execute test runs directly from AI conversations
- **Multiple Import Formats**: Import test results from JUnit, Cucumber, Xray JSON, Robot Framework, and TestNG
- **Query & Management**: Query test executions, retrieve test information, and manage test plans
- **Type-Safe**: Built with TypeScript for robust type checking and IDE support

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd xray-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure based on your Xray deployment:

#### For Xray Cloud

```env
XRAY_DEPLOYMENT=cloud
XRAY_CLOUD_CLIENT_ID=your_client_id
XRAY_CLOUD_CLIENT_SECRET=your_client_secret
```

Get your API credentials from: https://xray.cloud.getxray.app/api-keys

#### For Xray Server/Data Center

**Using Personal Access Token (Recommended)**

```env
XRAY_DEPLOYMENT=server
XRAY_JIRA_BASE_URL=https://your-jira-instance.com
XRAY_AUTH_TYPE=token
XRAY_TOKEN=your_personal_access_token
```

**Using Basic Authentication**

```env
XRAY_DEPLOYMENT=server
XRAY_JIRA_BASE_URL=https://your-jira-instance.com
XRAY_AUTH_TYPE=basic
XRAY_USERNAME=your_username
XRAY_PASSWORD=your_password
```

### MCP Client Configuration

Add this server to your MCP client configuration (e.g., Claude Desktop):

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "xray": {
      "command": "node",
      "args": ["/absolute/path/to/xray-mcp-server/dist/index.js"],
      "env": {
        "XRAY_DEPLOYMENT": "cloud",
        "XRAY_CLOUD_CLIENT_ID": "your_client_id",
        "XRAY_CLOUD_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

Or if you want to use the `.env` file, ensure it's in the working directory:

```json
{
  "mcpServers": {
    "xray": {
      "command": "node",
      "args": ["/absolute/path/to/xray-mcp-server/dist/index.js"],
      "cwd": "/absolute/path/to/xray-mcp-server"
    }
  }
}
```

## Available Tools

### 1. import_test_results

Import automated test execution results from various formats.

**Supported Formats:**
- `junit` - JUnit XML format
- `cucumber` - Cucumber JSON format
- `xray-json` - Xray native JSON format
- `robot` - Robot Framework XML format
- `testng` - TestNG XML format

**Example:**

```
Import JUnit test results for project DEMO with test plan DEMO-100:
- Format: junit
- Project: DEMO
- Test Plan: DEMO-100
- Results: <xml content here>
```

### 2. execute_tests

Create and execute a test run in Xray for specified test cases.

**Example:**

```
Execute tests DEMO-1, DEMO-2, and DEMO-3 with:
- Test Plan: DEMO-100
- Environments: Chrome, Production
- Summary: Regression Test Run - Sprint 5
```

### 3. query_test_executions

Query and filter test executions in Xray.

**Example:**

```
Find all test executions in project DEMO:
- Created after: 2024-01-01
- Status: FAIL
- Limit: 20
```

### 4. get_test_info

Retrieve detailed information about a specific test case.

**Example:**

```
Get information for test case DEMO-123
```

### 5. create_test_execution

Create a new test execution container in Xray.

**Example:**

```
Create a test execution in project DEMO:
- Summary: API Regression Test - Release 2.0
- Description: Testing all API endpoints for release 2.0
- Test Plan: DEMO-100
- Environments: QA, Staging
```

### 6. update_test_execution

Update status and details of a test within an execution.

**Example:**

```
Update test DEMO-5 in execution DEMO-200:
- Status: PASS
- Comment: All assertions passed successfully
```

### 7. get_test_plans

List test plans in a project.

**Example:**

```
Get test plans for project DEMO, limit 10
```

### 8. associate_tests_to_execution

Add test cases to an existing test execution.

**Example:**

```
Associate tests DEMO-10, DEMO-11, DEMO-12 to execution DEMO-200
```

## Usage Examples

### Importing JUnit Results

```xml
<!-- example-junit.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="Test Suite" tests="2" failures="1" errors="0" time="5.123">
  <testcase classname="com.example.LoginTest" name="testSuccessfulLogin" time="2.5">
  </testcase>
  <testcase classname="com.example.LoginTest" name="testInvalidPassword" time="2.623">
    <failure message="Expected error message not displayed">
      AssertionError: Expected error message not displayed
    </failure>
  </testcase>
</testsuite>
```

Then in your AI conversation:

```
Import these JUnit test results to project DEMO:
- Format: junit
- Project: DEMO
- Test Plan: DEMO-100
- Results: <paste XML content>
```

### Executing Tests

```
Execute the following tests:
- DEMO-1: Login with valid credentials
- DEMO-2: Login with invalid credentials
- DEMO-3: Password reset flow

Associate with test plan DEMO-100 and run in Chrome environment
```

### Querying Test Executions

```
Find all failed test executions in project DEMO from the last week
```

## API Coverage

| Feature | Xray Cloud | Xray Server/DC |
|---------|------------|----------------|
| Import JUnit | ✅ | ✅ |
| Import Cucumber | ✅ | ✅ |
| Import Xray JSON | ✅ | ✅ |
| Import Robot | ✅ | ✅ |
| Execute Tests | ✅ | ✅ |
| Query Executions | ✅ (GraphQL) | ✅ (JQL) |
| Get Test Info | ✅ | ✅ |
| Create Execution | ✅ | ✅ |
| Update Test Run | ✅ | ✅ |
| Get Test Plans | ✅ | ✅ |
| Associate Tests | ✅ | ✅ |

## Architecture

The server uses a multi-client architecture:

```
┌─────────────────┐
│   MCP Server    │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
    ┌────▼────┐    ┌────▼────┐
    │  Cloud  │    │ Server  │
    │ Client  │    │ Client  │
    └────┬────┘    └────┬────┘
         │              │
         │              │
    Xray Cloud    Xray Server/DC
```

- **XrayClient Interface**: Common interface for both clients
- **CloudClient**: Implements Xray Cloud API v2 with GraphQL
- **ServerClient**: Implements Xray Server/DC REST API v1
- **Factory Pattern**: Automatically creates the correct client based on configuration

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building

```bash
npm run build
```

### Project Structure

```
xray-mcp-server/
├── src/
│   ├── index.ts                 # Entry point
│   ├── server.ts                # MCP server setup
│   ├── config/                  # Configuration management
│   ├── xray/                    # Xray API clients
│   │   ├── client.ts            # Client interface
│   │   ├── cloud-client.ts      # Cloud implementation
│   │   ├── server-client.ts     # Server implementation
│   │   ├── factory.ts           # Client factory
│   │   └── types.ts             # Type definitions
│   ├── tools/                   # MCP tool definitions
│   └── utils/                   # Utilities
├── dist/                        # Compiled output
├── package.json
├── tsconfig.json
└── .env                         # Configuration (not in git)
```

## Troubleshooting

### Authentication Errors

**Error**: `Authentication failed. Please check your credentials.`

**Solution**:
- For Cloud: Verify your Client ID and Client Secret at https://xray.cloud.getxray.app/api-keys
- For Server: Verify your token or username/password. Ensure the user has proper permissions.

### Connection Errors

**Error**: `Network error: Unable to reach Xray API`

**Solution**:
- Check your `XRAY_JIRA_BASE_URL` is correct (for Server deployment)
- Verify network connectivity to Xray
- Check if a proxy or firewall is blocking the connection

### Invalid Test Key Format

**Error**: `Invalid test key format`

**Solution**: Test keys must follow the format `PROJECT-123` where PROJECT is the project key and 123 is the issue number.

### Import Failures

**Error**: Import fails with validation errors

**Solution**:
- Verify the XML/JSON format is correct for the specified format type
- Check that the project key exists in Jira
- Ensure test keys referenced in results exist (or use `autoCreateTests: true` for Cloud)

### Missing Dependencies

**Error**: TypeScript errors or missing modules

**Solution**: Run `npm install` to ensure all dependencies are installed.

## Contributing

Contributions are welcome! Please ensure:
- Code follows the existing style
- TypeScript types are properly defined
- Error handling is comprehensive
- Documentation is updated for new features

## License

MIT

## Resources

- [Xray Cloud REST API Documentation](https://docs.getxray.app/display/XRAYCLOUD/REST+API)
- [Xray Server REST API Documentation](https://docs.getxray.app/display/XRAY/REST+API)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Xray Import Formats](https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results)

## Support

For issues and questions:
- Check the troubleshooting section above
- Review Xray API documentation
- Open an issue in the repository
