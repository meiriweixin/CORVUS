# AWS Lambda Crawler Setup Guide - Windows PowerShell

This guide provides Windows PowerShell specific commands for setting up the MIS2 crawler on AWS Lambda.

## Prerequisites

- AWS CLI configured (you already have this ✅)
- PowerShell 5.1+ or PowerShell Core
- Node.js 18+ installed locally
- PostgreSQL database (AWS RDS recommended)
- Azure OpenAI or OpenAI API access

## Step 1: Create Playwright Layer (Windows)

```powershell
# Navigate to lambda directory
cd "C:\Ai stuffs\Mis2\lambda"

# Your playwright layer is already created, let's publish it
cd playwright-layer

# Create the layer zip (you already did this)
# Compress-Archive -Path .\nodejs\* -DestinationPath .\playwright-layer.zip

# Publish the layer (use backticks for line continuation in PowerShell)
aws lambda publish-layer-version `
  --layer-name playwright-chromium `
  --zip-file fileb://playwright-layer.zip `
  --compatible-runtimes nodejs18.x nodejs20.x `
  --region ap-southeast-1
```

## Step 2: Create Lambda Function

```powershell
# Go back to lambda directory
cd ..

# Install dependencies
npm install

# Create deployment package (exclude large node_modules)
$exclude = @('node_modules/playwright*', '*.zip', 'playwright-layer/*')
Compress-Archive -Path .\* -DestinationPath .\crawler-lambda.zip -Force

# Create IAM role first (save this ARN for later)
$trustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
"@

# Save trust policy to file
$trustPolicy | Out-File -FilePath .\trust-policy.json -Encoding utf8

# Create IAM role
aws iam create-role `
  --role-name lambda-mis2-crawler-role `
  --assume-role-policy-document file://trust-policy.json `
  --region ap-southeast-1

# Attach basic Lambda execution policy
aws iam attach-role-policy `
  --role-name lambda-mis2-crawler-role `
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole `
  --region ap-southeast-1

# Get your account ID
$accountId = (aws sts get-caller-identity --query Account --output text)
Write-Host "Your Account ID: $accountId"

# Get the layer ARN from the previous step
$layerArn = (aws lambda list-layers --query 'Layers[?LayerName==`playwright-chromium`].LatestMatchingVersion.LayerVersionArn' --output text --region ap-southeast-1)
Write-Host "Layer ARN: $layerArn"

# Create Lambda function
aws lambda create-function `
  --function-name mis2-crawler `
  --runtime nodejs18.x `
  --role "arn:aws:iam::${accountId}:role/lambda-mis2-crawler-role" `
  --handler crawler-lambda.handler `
  --zip-file fileb://crawler-lambda.zip `
  --timeout 900 `
  --memory-size 3008 `
  --layers $layerArn `
  --region ap-southeast-1
```

## Step 3: Set Environment Variables

```powershell
# Set your environment variables (replace with your actual values)
$envVarsObj = @{
    Variables = @{
        AWS_RDS_ENDPOINT = "database-1-instance-1.c96kcq8k0crv.ap-southeast-1.rds.amazonaws.com"
        AWS_RDS_PORT = "5432"
        AWS_RDS_USERNAME = "postgres"
        AWS_RDS_PASSWORD = "postgres"
        AWS_RDS_DATABASE = "postgres"
        USE_AZURE_OPENAI = "true"
        AZURE_OPENAI_API_KEY = "BHK6usMsp3Jxp0cbTvVUUv5VrKPNkFACbgcTq1zymH3EPtIO1UokJQQJ99BEACHYHv6XJ3w3AAAAACOGZq5y"
        AZURE_OPENAI_ENDPOINT = "https://admk-mag2rejv-eastus2.cognitiveservices.azure.com/"
        AZURE_OPENAI_DEPLOYMENT_NAME = "gpt-4.1"
        AZURE_OPENAI_EMBEDDINGS_ENDPOINT = "https://zhupocai01.openai.azure.com/"
        AZURE_OPENAI_EMBEDDINGS_API_KEY = "22e2f77e7e8f46399e66b1efb5e664cb"
        AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT = "text-embedding-3-small"
        AZURE_OPENAI_EMBEDDINGS_API_VERSION = "2023-05-15"
        NODE_OPTIONS = "--max-old-space-size=2048"
    }
}

# Save with ASCII encoding (no BOM)
$envVarsObj | ConvertTo-Json -Depth 2 | Out-File -FilePath .\env-vars.json -Encoding ascii

# Update Lambda
aws lambda update-function-configuration --function-name mis2-crawler --environment file://env-vars.json --region ap-southeast-1
```

## Step 4: Create Scheduler API Lambda

```powershell
# Create scheduler API function
aws lambda create-function `
  --function-name mis2-scheduler-api `
  --runtime nodejs18.x `
  --role "arn:aws:iam::${accountId}:role/lambda-mis2-crawler-role" `
  --handler scheduler-api.handler `
  --zip-file fileb://scheduler-api.zip `
  --timeout 30 `
  --memory-size 512 `
  --region ap-southeast-1

# Set environment variables for scheduler API
$schedulerEnvVars = @{
    CRAWLER_LAMBDA_ARN = "arn:aws:lambda:ap-southeast-1:${accountId}:function:mis2-crawler"
    AWS_REGION = "ap-southeast-1"
    AWS_ACCOUNT_ID = $accountId
}

$schedulerEnvVarsJson = ($schedulerEnvVars.GetEnumerator() | ForEach-Object { "`"$($_.Key)`":`"$($_.Value)`"" }) -join ","
$schedulerEnvVarsJson = "{$schedulerEnvVarsJson}"

aws lambda update-function-configuration `
  --function-name mis2-scheduler-api `
  --environment "Variables=$schedulerEnvVarsJson" `
  --region ap-southeast-1
```

## Step 5: Create EventBridge Permission

```powershell
# Allow EventBridge to invoke the crawler Lambda
aws lambda add-permission `
  --function-name mis2-crawler `
  --statement-id allow-eventbridge `
  --action lambda:InvokeFunction `
  --principal events.amazonaws.com `
  --region ap-southeast-1
```

## Step 6: Test the Lambda Function

```powershell
# Create test event
$testEvent = @"
{
  "urls": ["https://example.com"],
  "config": {
    "maxRequestsPerCrawl": 5,
    "enableAI": true,
    "headless": true
  }
}
"@

$testEvent | Out-File -FilePath .\test-event.json -Encoding utf8

# Invoke the function
aws lambda invoke `
  --function-name mis2-crawler `
  --payload file://test-event.json `
  --region ap-southeast-1 `
  response.json

# Check the response
Get-Content .\response.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

## Step 7: Create API Gateway (Optional)

If you want to expose the scheduler API via HTTP:

```powershell
# Create HTTP API
$apiId = (aws apigatewayv2 create-api `
  --name mis2-scheduler-api `
  --protocol-type HTTP `
  --cors-configuration 'AllowCredentials=false,AllowHeaders=*,AllowMethods=*,AllowOrigins=*' `
  --region ap-southeast-1 `
  --query 'ApiId' --output text)

Write-Host "API ID: $apiId"

# Create integration
$integrationId = (aws apigatewayv2 create-integration `
  --api-id $apiId `
  --integration-type AWS_PROXY `
  --integration-uri "arn:aws:lambda:ap-southeast-1:${accountId}:function:mis2-scheduler-api" `
  --payload-format-version '2.0' `
  --region ap-southeast-1 `
  --query 'IntegrationId' --output text)

# Create routes
aws apigatewayv2 create-route `
  --api-id $apiId `
  --route-key 'GET /schedules' `
  --target "integrations/$integrationId" `
  --region ap-southeast-1

aws apigatewayv2 create-route `
  --api-id $apiId `
  --route-key 'POST /schedules' `
  --target "integrations/$integrationId" `
  --region ap-southeast-1

aws apigatewayv2 create-route `
  --api-id $apiId `
  --route-key 'PUT /schedules/{id}' `
  --target "integrations/$integrationId" `
  --region ap-southeast-1

aws apigatewayv2 create-route `
  --api-id $apiId `
  --route-key 'DELETE /schedules/{id}' `
  --target "integrations/$integrationId" `
  --region ap-southeast-1

# Create stage
aws apigatewayv2 create-stage `
  --api-id $apiId `
  --stage-name 'prod' `
  --auto-deploy `
  --region ap-southeast-1

# Allow API Gateway to invoke Lambda
aws lambda add-permission `
  --function-name mis2-scheduler-api `
  --statement-id allow-apigateway `
  --action lambda:InvokeFunction `
  --principal apigateway.amazonaws.com `
  --source-arn "arn:aws:execute-api:ap-southeast-1:${accountId}:${apiId}/*/*" `
  --region ap-southeast-1

# Get API endpoint
$apiEndpoint = (aws apigatewayv2 get-api --api-id $apiId --query 'ApiEndpoint' --output text --region ap-southeast-1)
Write-Host "API Endpoint: $apiEndpoint"
```

## Step 8: Create Sample EventBridge Schedule

```powershell
# Create a daily schedule rule
aws events put-rule `
  --name mis2-daily-test `
  --description "Test daily MIS2 crawler" `
  --schedule-expression "cron(0 9 * * ? *)" `
  --state ENABLED `
  --region ap-southeast-1

# Add target
$targetInput = @"
{
  "urls": ["https://example.com"],
  "config": {
    "maxRequestsPerCrawl": 10,
    "enableAI": true,
    "headless": true
  }
}
"@

aws events put-targets `
  --rule mis2-daily-test `
  --targets "Id=1,Arn=arn:aws:lambda:ap-southeast-1:${accountId}:function:mis2-crawler,Input='$targetInput'" `
  --region ap-southeast-1
```

## Troubleshooting Commands

```powershell
# Check Lambda function status
aws lambda get-function --function-name mis2-crawler --region ap-southeast-1

# Check logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/mis2-crawler --region ap-southeast-1

# Get latest log events
aws logs describe-log-streams `
  --log-group-name /aws/lambda/mis2-crawler `
  --order-by LastEventTime `
  --descending `
  --max-items 1 `
  --region ap-southeast-1

# Check EventBridge rules
aws events list-rules --name-prefix mis2- --region ap-southeast-1

# Check IAM role
aws iam get-role --role-name lambda-mis2-crawler-role
```

## Common PowerShell Issues and Solutions

1. **Multi-line commands**: Use backticks (`) not backslashes (\)
2. **JSON escaping**: Use double quotes and escape inner quotes with backticks
3. **File paths**: Use forward slashes or double backslashes
4. **Variables**: Use `$variable` syntax and `${variable}` for complex expressions

## Quick Deploy Script

Create `deploy.ps1`:

```powershell
# Quick deployment script
param(
    [string]$FunctionName = "mis2-crawler",
    [string]$Region = "ap-southeast-1"
)

Write-Host "Building deployment package..."
Compress-Archive -Path .\* -DestinationPath .\crawler-lambda.zip -Force

Write-Host "Updating Lambda function..."
aws lambda update-function-code `
    --function-name $FunctionName `
    --zip-file fileb://crawler-lambda.zip `
    --region $Region

Write-Host "Deployment completed!"
```

Run with: `.\deploy.ps1` 