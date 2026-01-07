# Test Result Examples

This directory contains example test result files that you can use to test the Xray MCP server's import functionality.

## Files

### junit-example.xml

JUnit XML format example containing:
- 5 test cases in a Login Test Suite
- 2 passed tests
- 2 failed tests with detailed failure messages
- 1 skipped test
- System output and error details
- Test properties (environment, browser)

**Usage with MCP:**
```
Import the JUnit test results:
- Format: junit
- Project: DEMO
- Test Plan: DEMO-100
- Results: <paste contents of junit-example.xml>
```

### cucumber-example.json

Cucumber JSON format example containing:
- 2 features: User Authentication and Shopping Cart Management
- Multiple scenarios with different outcomes (passed, failed, skipped)
- Detailed step definitions with execution times
- Tags for categorization (@authentication, @smoke, @shopping, @validation)
- Failed scenario with error message

**Usage with MCP:**
```
Import the Cucumber test results:
- Format: cucumber
- Project: DEMO
- Test Plan: DEMO-100
- Environments: Chrome, QA
- Results: <paste contents of cucumber-example.json>
```

## Testing the Import Functionality

### Step 1: Set up your environment

Make sure your `.env` file is configured with valid Xray credentials:

```bash
cp .env.example .env
# Edit .env with your Xray deployment and credentials
```

### Step 2: Configure Claude Desktop

Add the server to your MCP configuration:

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

### Step 3: Import test results

In your conversation with Claude:

**For JUnit:**
```
Import these JUnit test results to my Xray project DEMO:
<paste contents of examples/junit-example.xml>
```

**For Cucumber:**
```
Import these Cucumber test results to my Xray project DEMO with test plan DEMO-100:
<paste contents of examples/cucumber-example.json>
```

## What Gets Created in Xray

### JUnit Import

The import will create:
- A Test Execution issue
- Test cases for each `<testcase>` (if they don't exist)
- Test runs with status (PASS/FAIL/ABORTED for skipped)
- Execution details including duration and failure messages

### Cucumber Import

The import will create:
- A Test Execution issue
- Test cases for each Cucumber scenario (if they don't exist)
- Test runs with status based on scenario results
- Execution details with step information
- Tags associated with tests

## Customizing the Examples

You can modify these examples to match your actual test results:

1. **Change test names and descriptions** to match your test scenarios
2. **Adjust failure messages** to reflect your actual test failures
3. **Update execution times** to realistic values
4. **Modify properties/tags** for your environment
5. **Add more test cases** to test bulk imports

## Expected Results

After a successful import, you should see:

```
{
  "testExecIssue": {
    "id": "12345",
    "key": "DEMO-200",
    "self": "https://..."
  },
  "testIssues": [
    {
      "id": "12346",
      "key": "DEMO-201",
      "self": "https://..."
    },
    ...
  ]
}
```

The response includes:
- The Test Execution key (e.g., `DEMO-200`)
- Keys for all test cases created or updated
- Links to the issues in Jira/Xray

## Troubleshooting

### Import fails with "project not found"
- Verify the project key exists in your Jira instance
- Check that your credentials have access to the project

### Tests not created
- For Xray Cloud, you may need to set `autoCreateTests: true`
- For Xray Server, ensure test cases already exist or map them correctly

### Authentication errors
- Verify your `.env` configuration
- Check that your API credentials are valid
- Ensure the user has permissions to create issues

## Additional Formats

The server also supports:
- **Xray JSON**: Native Xray format with full control
- **Robot Framework**: Robot test results XML
- **TestNG**: TestNG XML results

Examples for these formats can be added based on your needs.
