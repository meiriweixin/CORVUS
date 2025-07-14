# Environment Variables for AWS Lambda Crawler

## Required Database Configuration

```bash
# AWS RDS PostgreSQL Database
AWS_RDS_ENDPOINT=your-rds-instance.cluster-xxxxxx.us-east-1.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_USERNAME=mis2user
AWS_RDS_PASSWORD=your-secure-database-password
AWS_RDS_DATABASE=mis2

# Alternative: Database URL (if using connection string)
# DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

## Required AI Configuration

### Option 1: Azure OpenAI (Recommended)

```bash
USE_AZURE_OPENAI=true
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-10-21
```

### Option 2: OpenAI

```bash
USE_AZURE_OPENAI=false
OPENAI_API_KEY=sk-your-openai-api-key
```

## Optional Embeddings Configuration

```bash
# Azure OpenAI Embeddings (for vector search)
AZURE_OPENAI_EMBEDDINGS_API_KEY=your-embeddings-api-key
AZURE_OPENAI_EMBEDDINGS_ENDPOINT=https://your-embeddings-resource.openai.azure.com
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT=text-embedding-3-small
AZURE_OPENAI_EMBEDDINGS_API_VERSION=2023-05-15
```

## Lambda Performance Configuration

```bash
# Node.js Memory Optimization
NODE_OPTIONS=--max-old-space-size=2048

# Lambda Runtime
AWS_LAMBDA_RUNTIME_DIR=/opt/nodejs
```

## Crawler Configuration (Optional)

```bash
# Default crawler settings (can be overridden in event payload)
DEFAULT_MAX_REQUESTS=50
DEFAULT_MAX_CONCURRENCY=3
DEFAULT_TIMEOUT=120
DEFAULT_ENABLE_AI=true
DEFAULT_ENABLE_SCREENSHOTS=false
DEFAULT_HEADLESS=true
```

## Security Configuration

```bash
# If using AWS Secrets Manager
AWS_SECRET_NAME=mis2/database-credentials
AWS_SECRET_REGION=us-east-1

# If using VPC
VPC_SUBNET_IDS=subnet-12345678,subnet-87654321
VPC_SECURITY_GROUP_IDS=sg-12345678
```

## Logging Configuration

```bash
# CloudWatch Logs
LOG_LEVEL=INFO
LOG_FORMAT=json

# Custom log group (optional)
CUSTOM_LOG_GROUP=/aws/lambda/mis2-crawler
```

## How to Set Environment Variables

### 1. Via AWS CLI

```bash
aws lambda update-function-configuration \
  --function-name mis2-crawler \
  --environment Variables="{
    AWS_RDS_ENDPOINT=your-rds-endpoint.amazonaws.com,
    AWS_RDS_PORT=5432,
    AWS_RDS_USERNAME=mis2user,
    AWS_RDS_PASSWORD=your-password,
    AWS_RDS_DATABASE=mis2,
    USE_AZURE_OPENAI=true,
    AZURE_OPENAI_API_KEY=your-key,
    AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com,
    AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4,
    NODE_OPTIONS=--max-old-space-size=2048
  }"
```

### 2. Via AWS Console

1. Go to AWS Lambda Console
2. Select your function (`mis2-crawler`)
3. Go to Configuration → Environment variables
4. Add each variable listed above

### 3. Via CloudFormation/CDK

```yaml
Environment:
  Variables:
    AWS_RDS_ENDPOINT: !GetAtt DatabaseCluster.Endpoint.Address
    AWS_RDS_PORT: !GetAtt DatabaseCluster.Endpoint.Port
    AWS_RDS_USERNAME: !Ref DatabaseUsername
    AWS_RDS_PASSWORD: !Ref DatabasePassword
    AWS_RDS_DATABASE: mis2
    USE_AZURE_OPENAI: true
    AZURE_OPENAI_API_KEY: !Ref AzureOpenAIKey
    AZURE_OPENAI_ENDPOINT: !Ref AzureOpenAIEndpoint
    AZURE_OPENAI_DEPLOYMENT_NAME: gpt-4
    NODE_OPTIONS: --max-old-space-size=2048
```

### 4. Via Terraform

```hcl
resource "aws_lambda_function" "mis2_crawler" {
  function_name = "mis2-crawler"
  
  environment {
    variables = {
      AWS_RDS_ENDPOINT                = var.rds_endpoint
      AWS_RDS_PORT                   = var.rds_port
      AWS_RDS_USERNAME               = var.rds_username
      AWS_RDS_PASSWORD               = var.rds_password
      AWS_RDS_DATABASE               = "mis2"
      USE_AZURE_OPENAI               = "true"
      AZURE_OPENAI_API_KEY           = var.azure_openai_api_key
      AZURE_OPENAI_ENDPOINT          = var.azure_openai_endpoint
      AZURE_OPENAI_DEPLOYMENT_NAME   = "gpt-4"
      NODE_OPTIONS                   = "--max-old-space-size=2048"
    }
  }
}
```

## Environment Variables for Scheduler API

If you're implementing the scheduler API, add these:

```bash
# Scheduler API specific
CRAWLER_LAMBDA_ARN=arn:aws:lambda:us-east-1:123456789012:function:mis2-crawler
EVENTBRIDGE_RULE_PREFIX=mis2-
DEFAULT_SCHEDULE_TIMEZONE=UTC

# API Gateway (if using custom domain)
API_GATEWAY_DOMAIN=scheduler.yourdomain.com
```

## Security Best Practices

### 1. Use AWS Secrets Manager

Instead of storing sensitive values directly:

```bash
# Store in Secrets Manager
aws secretsmanager create-secret \
  --name mis2/database-credentials \
  --secret-string '{"username":"mis2user","password":"your-secure-password"}'

# Reference in Lambda
AWS_SECRET_NAME=mis2/database-credentials
```

### 2. Use Parameter Store

```bash
# Store in Parameter Store
aws ssm put-parameter \
  --name "/mis2/azure-openai-key" \
  --value "your-api-key" \
  --type "SecureString"

# Reference in Lambda
AZURE_OPENAI_KEY_PARAMETER=/mis2/azure-openai-key
```

## Validation Script

Create a validation script to check environment variables:

```bash
#!/bin/bash

# validate-env.sh
echo "Validating Lambda environment variables..."

# Check required database variables
if [ -z "$AWS_RDS_ENDPOINT" ]; then
  echo "❌ AWS_RDS_ENDPOINT is required"
  exit 1
fi

if [ -z "$AWS_RDS_USERNAME" ]; then
  echo "❌ AWS_RDS_USERNAME is required"
  exit 1
fi

if [ -z "$AWS_RDS_PASSWORD" ]; then
  echo "❌ AWS_RDS_PASSWORD is required"
  exit 1
fi

# Check AI configuration
if [ "$USE_AZURE_OPENAI" = "true" ]; then
  if [ -z "$AZURE_OPENAI_API_KEY" ]; then
    echo "❌ AZURE_OPENAI_API_KEY is required when using Azure OpenAI"
    exit 1
  fi
  
  if [ -z "$AZURE_OPENAI_ENDPOINT" ]; then
    echo "❌ AZURE_OPENAI_ENDPOINT is required when using Azure OpenAI"
    exit 1
  fi
else
  if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY is required when not using Azure OpenAI"
    exit 1
  fi
fi

echo "✅ All environment variables are valid"
```

## Minimal Required Configuration

For a basic setup, you only need these:

```bash
# Database
AWS_RDS_ENDPOINT=your-rds-endpoint.amazonaws.com
AWS_RDS_USERNAME=mis2user
AWS_RDS_PASSWORD=your-password
AWS_RDS_DATABASE=mis2

# AI
USE_AZURE_OPENAI=true
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Performance
NODE_OPTIONS=--max-old-space-size=2048
```

## Testing Environment Variables

Test your configuration with this Lambda test event:

```json
{
  "urls": ["https://example.com"],
  "config": {
    "maxRequestsPerCrawl": 5,
    "enableAI": true,
    "headless": true
  }
}
```

Save this as `test-event.json` and run:

```bash
aws lambda invoke \
  --function-name mis2-crawler \
  --payload file://test-event.json \
  response.json
```

## Troubleshooting Environment Variables

### Common Issues

1. **Database Connection Failed**
   - Check `AWS_RDS_ENDPOINT` format
   - Verify security group allows Lambda access
   - Ensure RDS is in same VPC or publicly accessible

2. **AI API Errors**
   - Verify API keys are correct
   - Check endpoint URLs don't have trailing slashes
   - Ensure deployment names match exactly

3. **Memory Issues**
   - Increase `NODE_OPTIONS` memory allocation
   - Consider increasing Lambda memory allocation

### Debug Commands

```bash
# Get current environment variables
aws lambda get-function-configuration \
  --function-name mis2-crawler \
  --query 'Environment.Variables'

# Test database connection
aws rds describe-db-instances \
  --db-instance-identifier your-db-instance
``` 