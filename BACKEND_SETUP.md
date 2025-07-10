# MIS2 Crawler Backend Setup Guide

## Architecture Overview

The MIS2 Crawler has been restructured to fix the browser compatibility issue with Crawlee. The new architecture consists of:

- **Frontend (React + Vite)**: User interface that runs in the browser
- **Backend (Node.js + Express + Socket.IO)**: Crawlee crawler service that runs on the server
- **WebSocket Communication**: Real-time updates between frontend and backend

## Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Backend Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# OpenAI Configuration (choose one)
OPENAI_API_KEY=your_openai_api_key_here

# Azure OpenAI Configuration (alternative to OpenAI)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-10-21

# Playwright Configuration
PLAYWRIGHT_BROWSERS_PATH=./node_modules/playwright-core/.local-browsers
```

### 3. Install Playwright Browsers

```bash
cd backend
npx playwright install
```

### 4. Start Backend Server

```bash
cd backend
npm run dev
```

### 5. Install Frontend Dependencies

```bash
cd ..  # Back to project root
npm install
```

### 6. Start Frontend Development Server

```bash
npm run dev
```

### 7. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Backend Health Check: http://localhost:3001/api/health

## Detailed Configuration

### Backend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Backend server port | No | 3001 |
| `NODE_ENV` | Environment mode | No | development |
| `FRONTEND_URL` | Frontend URL for CORS | No | http://localhost:5173 |
| `OPENAI_API_KEY` | OpenAI API key | No* | - |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key | No* | - |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint | No | - |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Azure OpenAI deployment | No | gpt-4 |
| `AZURE_OPENAI_API_VERSION` | Azure OpenAI API version | No | 2024-10-21 |

*Either `OPENAI_API_KEY` or `AZURE_OPENAI_API_KEY` is required for AI processing. If neither is provided, the crawler will run in content extraction mode only.

### Backend Scripts

```json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "clean": "rimraf dist"
}
```

### Production Deployment

1. **Build Backend**:
   ```bash
   cd backend
   npm run build
   ```

2. **Set Production Environment**:
   ```env
   NODE_ENV=production
   PORT=3001
   FRONTEND_URL=https://your-frontend-domain.com
   ```

3. **Start Production Server**:
   ```bash
   npm start
   ```

## API Endpoints

### REST API

- `GET /api/health` - Health check and status
- `GET /api/configs` - Get default crawler configurations

### WebSocket Events

#### Client to Server
- `crawl:start` - Start crawling with URLs and config
- `crawl:cancel` - Cancel active crawl
- `crawl:clear-screenshots` - Clear all screenshots

#### Server to Client
- `crawl:log` - Real-time log message
- `crawl:progress` - Statistics update
- `crawl:phase` - Current crawling phase
- `crawl:screenshot` - New screenshot captured
- `crawl:raw-item` - New raw content item extracted
- `crawl:processed-item` - New AI-processed article
- `crawl:completed` - Crawl finished
- `crawl:error` - Error occurred

## Architecture Benefits

### ✅ Fixed Issues
- **Browser Compatibility**: Crawlee now runs in Node.js where it belongs
- **Real-time Updates**: WebSocket provides live progress updates
- **Scalability**: Backend can handle multiple concurrent crawls
- **Error Handling**: Better separation of concerns and error isolation

### 🚀 New Features
- **Health Monitoring**: Backend health check endpoint
- **Auto-reconnection**: Frontend automatically reconnects to backend
- **Graceful Shutdown**: Proper cleanup of active crawlers
- **Screenshot Management**: Automatic cleanup and manual management
- **Configuration Presets**: Backend serves optimized configurations

## Troubleshooting

### Common Issues

#### 1. Backend Connection Failed
- **Issue**: Frontend shows "Not connected to backend server"
- **Solution**: 
  - Ensure backend is running: `cd backend && npm run dev`
  - Check port 3001 is not in use
  - Verify CORS configuration

#### 2. Playwright Browser Installation
- **Issue**: "Browser not found" error
- **Solution**: 
  ```bash
  cd backend
  npx playwright install
  ```

#### 3. AI Processing Not Working
- **Issue**: No AI-processed articles generated
- **Solution**: 
  - Verify `OPENAI_API_KEY` or Azure OpenAI credentials
  - Check API key has sufficient credits/quota
  - Review backend logs for API errors

#### 4. WebSocket Connection Issues
- **Issue**: Real-time updates not working
- **Solution**: 
  - Check firewall settings for port 3001
  - Verify WebSocket support in your environment
  - Try refreshing the frontend page

### Debug Commands

```bash
# Check backend health
curl http://localhost:3001/api/health

# View backend logs
cd backend && npm run dev

# Test frontend connection
# Open browser developer tools and check for WebSocket connections
```

## Development Tips

1. **Use Two Terminals**: One for backend (`backend/npm run dev`) and one for frontend (`npm run dev`)

2. **Environment Files**: Keep `.env` files out of version control

3. **Hot Reload**: Both frontend and backend support hot reload for development

4. **API Testing**: Use the health endpoint to verify backend is working

5. **Log Monitoring**: Backend logs show all crawler activity and WebSocket connections

## Production Considerations

1. **Process Management**: Use PM2 or similar for production
2. **Reverse Proxy**: Configure nginx for SSL and routing
3. **Environment Variables**: Use secure secret management
4. **Monitoring**: Implement proper logging and monitoring
5. **Scaling**: Consider load balancing for multiple backend instances 