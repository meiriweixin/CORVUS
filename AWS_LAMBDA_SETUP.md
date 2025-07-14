# AWS Lambda Crawler Setup Guide

This guide will help you set up the MIS2 crawler as an AWS Lambda function with EventBridge scheduling.

## Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js 18+ installed locally
- PostgreSQL database (AWS RDS recommended)
- Azure OpenAI or OpenAI API access

## Architecture Overview

```
EventBridge Scheduler → Lambda Function → PostgreSQL Database
                          ↓
                     Playwright Browser
```

## Step 1: Create Lambda Function

### 1.1 Create the Lambda Function

```bash
# Create lambda directory and install dependencies
mkdir lambda
cd lambda
npm init -y
npm install crawlee playwright openai pg uuid

# Copy the crawler-lambda.js file (provided separately)
```

### 1.2 Create Playwright Layer

Since Playwright is large, create a Lambda layer:

```bash
# Create layer directory
mkdir -p playwright-layer/nodejs

# Install Playwright in layer
cd playwright-layer/nodejs
npm init -y
npm install playwright-core
npx playwright install chromium

# Create layer zip
cd ..
zip -r playwright-layer.zip nodejs/

# Create layer in AWS
aws lambda publish-layer-version \
  --layer-name playwright-chromium \
  --zip-file fileb://playwright-layer.zip \
  --compatible-runtimes nodejs18.x nodejs20.x
```

### 1.3 Create Lambda Function

```bash
# Back to lambda directory
cd ../../lambda

# Create deployment package
zip -r crawler-lambda.zip . -x "node_modules/playwright*"

# Create Lambda function
aws lambda create-function \
  --function-name mis2-crawler \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler crawler-lambda.handler \
  --zip-file fileb://crawler-lambda.zip \
  --timeout 900 \
  --memory-size 3008 \
  --layers arn:aws:lambda:YOUR_REGION:YOUR_ACCOUNT_ID:layer:playwright-chromium:1
```

## Step 2: Configure IAM Role

Create an IAM role for the Lambda function:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "rds:Connect"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:mis2/*"
    }
  ]
}
```

## Step 3: Environment Variables

Set these environment variables in your Lambda function:

```bash
# Database Configuration
AWS_RDS_ENDPOINT=your-rds-endpoint.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_USERNAME=mis2user
AWS_RDS_PASSWORD=your-password
AWS_RDS_DATABASE=mis2

# AI Configuration (Choose one)
USE_AZURE_OPENAI=true
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# OR OpenAI
USE_AZURE_OPENAI=false
OPENAI_API_KEY=your-openai-key

# Lambda Configuration
NODE_OPTIONS=--max-old-space-size=2048
```

## Step 4: Create EventBridge Rules

### 4.1 Daily Schedule

```bash
# Create rule for daily crawl
aws events put-rule \
  --name mis2-daily-crawl \
  --schedule-expression "cron(0 9 * * ? *)" \
  --description "Daily MIS2 crawler execution"

# Add Lambda target
aws events put-targets \
  --rule mis2-daily-crawl \
  --targets "Id"="1","Arn"="arn:aws:lambda:YOUR_REGION:YOUR_ACCOUNT_ID:function:mis2-crawler","Input"='{"urls":["https://example.com"],"config":{"maxRequestsPerCrawl":50}}'
```

### 4.2 Weekly Schedule

```bash
# Create rule for weekly crawl
aws events put-rule \
  --name mis2-weekly-crawl \
  --schedule-expression "cron(0 10 ? * MON *)" \
  --description "Weekly MIS2 crawler execution"

# Add Lambda target
aws events put-targets \
  --rule mis2-weekly-crawl \
  --targets "Id"="1","Arn"="arn:aws:lambda:YOUR_REGION:YOUR_ACCOUNT_ID:function:mis2-crawler","Input"='{"urls":["https://example.com"],"config":{"maxRequestsPerCrawl":100}}'
```

### 4.3 Monthly Schedule

```bash
# Create rule for monthly crawl
aws events put-rule \
  --name mis2-monthly-crawl \
  --schedule-expression "cron(0 11 1 * ? *)" \
  --description "Monthly MIS2 crawler execution"

# Add Lambda target
aws events put-targets \
  --rule mis2-monthly-crawl \
  --targets "Id"="1","Arn"="arn:aws:lambda:YOUR_REGION:YOUR_ACCOUNT_ID:function:mis2-crawler","Input"='{"urls":["https://example.com"],"config":{"maxRequestsPerCrawl":200}}'
```

## Step 5: Grant EventBridge Permissions

```bash
# Allow EventBridge to invoke Lambda
aws lambda add-permission \
  --function-name mis2-crawler \
  --statement-id allow-eventbridge \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:YOUR_REGION:YOUR_ACCOUNT_ID:rule/mis2-*
```

## Step 6: Create API for Scheduler Management

Create API Gateway endpoints for the scheduler UI:

```bash
# Create API Gateway
aws apigatewayv2 create-api \
  --name mis2-scheduler-api \
  --protocol-type HTTP \
  --cors-configuration AllowCredentials=false,AllowHeaders="*",AllowMethods="*",AllowOrigins="*"
```

### 6.1 Lambda Function for Scheduler API

Create `scheduler-api-lambda.js`:

```javascript
const AWS = require('aws-sdk');
const eventbridge = new AWS.EventBridge();

exports.handler = async (event) => {
  const { httpMethod, path, body } = event;
  
  try {
    switch (httpMethod) {
      case 'GET':
        if (path === '/schedules') {
          return await getSchedules();
        }
        break;
      case 'POST':
        if (path === '/schedules') {
          return await createSchedule(JSON.parse(body));
        }
        break;
      case 'PUT':
        if (path.startsWith('/schedules/')) {
          const id = path.split('/')[2];
          return await updateSchedule(id, JSON.parse(body));
        }
        break;
      case 'DELETE':
        if (path.startsWith('/schedules/')) {
          const id = path.split('/')[2];
          return await deleteSchedule(id);
        }
        break;
    }
    
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function getSchedules() {
  const params = {
    NamePrefix: 'mis2-'
  };
  
  const result = await eventbridge.listRules(params).promise();
  
  return {
    statusCode: 200,
    body: JSON.stringify(result.Rules)
  };
}

async function createSchedule(schedule) {
  const ruleName = `mis2-${schedule.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
  
  // Create EventBridge rule
  const ruleParams = {
    Name: ruleName,
    Description: `MIS2 Schedule: ${schedule.name}`,
    ScheduleExpression: createCronExpression(schedule),
    State: schedule.enabled ? 'ENABLED' : 'DISABLED'
  };
  
  await eventbridge.putRule(ruleParams).promise();
  
  // Add Lambda target
  const targetParams = {
    Rule: ruleName,
    Targets: [{
      Id: '1',
      Arn: process.env.CRAWLER_LAMBDA_ARN,
      Input: JSON.stringify({
        urls: schedule.urls,
        config: schedule.crawlerConfig
      })
    }]
  };
  
  await eventbridge.putTargets(targetParams).promise();
  
  return {
    statusCode: 201,
    body: JSON.stringify({ message: 'Schedule created', id: ruleName })
  };
}

function createCronExpression(schedule) {
  const { frequency, time, dayOfWeek, dayOfMonth, timezone } = schedule;
  const [hour, minute] = time.split(':');
  
  switch (frequency) {
    case 'daily':
      return `cron(${minute} ${hour} * * ? *)`;
    case 'weekly':
      return `cron(${minute} ${hour} ? * ${dayOfWeek + 1} *)`;
    case 'monthly':
      return `cron(${minute} ${hour} ${dayOfMonth} * ? *)`;
    default:
      throw new Error('Invalid frequency');
  }
}
```

## Step 7: Test the Setup

### 7.1 Test Lambda Function

```bash
# Test with sample event
aws lambda invoke \
  --function-name mis2-crawler \
  --payload '{"urls":["https://example.com"],"config":{"maxRequestsPerCrawl":5}}' \
  response.json

cat response.json
```

### 7.2 Test EventBridge Rule

```bash
# Test rule execution
aws events test-event-pattern \
  --event-pattern '{"source":["aws.events"],"detail-type":["Scheduled Event"]}' \
  --event '{"source":["aws.events"],"detail-type":["Scheduled Event"]}'
```

## Step 8: Monitoring and Logging

### 8.1 CloudWatch Dashboards

Create CloudWatch dashboards to monitor:
- Lambda execution duration
- Memory usage
- Error rates
- Database connections

### 8.2 Alerts

Set up CloudWatch alarms for:
- Lambda function errors
- Long execution times
- Database connection failures

## Step 9: Cost Optimization

### 9.1 Lambda Configuration

- Use ARM64 architecture for better price-performance
- Optimize memory allocation based on usage
- Use provisioned concurrency only if needed

### 9.2 Database

- Use RDS Proxy for connection pooling
- Consider Aurora Serverless for variable workloads
- Enable Performance Insights for optimization

## Environment Variables Reference

Add these to your Lambda function environment:

```bash
# Required Database Variables
AWS_RDS_ENDPOINT=your-rds-endpoint.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_USERNAME=mis2user
AWS_RDS_PASSWORD=your-secure-password
AWS_RDS_DATABASE=mis2

# Required AI Variables (Azure OpenAI)
USE_AZURE_OPENAI=true
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Optional AI Variables (OpenAI)
OPENAI_API_KEY=your-openai-key

# Lambda Performance
NODE_OPTIONS=--max-old-space-size=2048
```

## Troubleshooting

### Common Issues

1. **Timeout Errors**: Increase Lambda timeout (max 15 minutes)
2. **Memory Issues**: Increase memory allocation
3. **Database Connection**: Check VPC configuration and security groups
4. **Playwright Issues**: Verify layer installation and browser availability

### Debugging

```bash
# Check Lambda logs
aws logs tail /aws/lambda/mis2-crawler --follow

# Check EventBridge rule status
aws events describe-rule --name mis2-daily-crawl

# Test database connectivity
aws rds describe-db-instances --db-instance-identifier your-db-instance
```

## Security Best Practices

1. **Use IAM roles** with least privilege principle
2. **Store secrets** in AWS Secrets Manager
3. **Enable VPC** for database access
4. **Use encryption** for data at rest and in transit
5. **Monitor access** with CloudTrail

## Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash

# Build and deploy Lambda function
cd lambda
npm install
zip -r crawler-lambda.zip . -x "node_modules/playwright*"

# Update Lambda function
aws lambda update-function-code \
  --function-name mis2-crawler \
  --zip-file fileb://crawler-lambda.zip

# Update environment variables
aws lambda update-function-configuration \
  --function-name mis2-crawler \
  --environment Variables="{
    AWS_RDS_ENDPOINT=$AWS_RDS_ENDPOINT,
    AWS_RDS_PORT=$AWS_RDS_PORT,
    AWS_RDS_USERNAME=$AWS_RDS_USERNAME,
    AWS_RDS_PASSWORD=$AWS_RDS_PASSWORD,
    AWS_RDS_DATABASE=$AWS_RDS_DATABASE,
    USE_AZURE_OPENAI=$USE_AZURE_OPENAI,
    AZURE_OPENAI_API_KEY=$AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT=$AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_DEPLOYMENT_NAME=$AZURE_OPENAI_DEPLOYMENT_NAME,
    NODE_OPTIONS=--max-old-space-size=2048
  }"

echo "Deployment completed!"
```

This setup provides a complete serverless crawler solution that can be scheduled and managed through your UI. 