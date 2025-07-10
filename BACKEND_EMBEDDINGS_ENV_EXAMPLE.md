# Backend Environment Variables for Embeddings

Add the following environment variables to your `backend/.env` file:

```env
# Azure OpenAI Embeddings Configuration
AZURE_OPENAI_EMBEDDINGS_ENDPOINT=https://your-azure-openai-instance.openai.azure.com
AZURE_OPENAI_EMBEDDINGS_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT=text-embedding-3-small
AZURE_OPENAI_EMBEDDINGS_API_VERSION=2023-05-15

# Existing Azure OpenAI Configuration (for general AI processing)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-azure-openai-instance.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Database Configuration
AWS_RDS_ENDPOINT=your_rds_endpoint
AWS_RDS_PORT=5432
AWS_RDS_USERNAME=your_username
AWS_RDS_PASSWORD=your_password
AWS_RDS_DATABASE=your_database_name

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## Key Points:

1. **Embeddings vs General AI**: The embeddings use separate environment variables from your general AI processing
2. **Same API Key**: You can use the same Azure OpenAI API key for both embeddings and general AI processing
3. **Deployment Names**: Make sure your `text-embedding-3-small` deployment is created in your Azure OpenAI instance
4. **Vector Column**: Ensure your PostgreSQL database has the `vector` extension installed and the `vector` column in your articles table

## Testing the Setup:

After adding these variables, you can test the embeddings functionality by:

1. Starting your backend server
2. Running a crawl - it will now generate and store embeddings
3. Using the new similarity search endpoints:
   - `POST /api/search/similar` - Search for articles similar to a text query
   - `GET /api/articles/{id}/similar` - Find articles similar to a specific article 