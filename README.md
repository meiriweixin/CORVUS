# 🛡️ Advanced Cyber Intelligence Crawler (MIS2)

A sophisticated, AI-powered cybersecurity threat intelligence platform that crawls, analyzes, and visualizes cyber threats from across the web. This application combines advanced web crawling, AI-powered threat analysis, and interactive data visualization to provide comprehensive cybersecurity intelligence.

## 🌟 Key Features

### 🎯 **Intelligent Web Crawling**
- **Multi-site Crawler**: Crawl multiple cybersecurity websites simultaneously
- **Bot Detection Bypass**: Advanced stealth capabilities for strict sites (Bloomberg, WSJ, financial sites)
- **Real-time Progress**: Live crawling statistics, logs, and screenshot capture
- **Predefined Sources**: Quick access to popular cybersecurity news sites (Hacker News, ThreatPost, Krebs, etc.)
- **Configurable Presets**: Default, Bloomberg/Strict Sites, and Fast Crawling modes

### 🧠 **AI-Powered Threat Intelligence**
- **GPT-4 Analysis**: Azure OpenAI/OpenAI integration for threat assessment
- **Risk Scoring**: 0-10 risk assessment for each cybersecurity article
- **Event Classification**: Categorizes threats (CYBER_ATTACK, DATA_BREACH, MALWARE_CAMPAIGN, etc.)
- **Threat Actor Identification**: Extracts and identifies threat groups and attackers
- **Victim Analysis**: Identifies targeted organizations and sectors
- **CVE & Vulnerability Tracking**: Automatically extracts vulnerability information

### 📊 **Interactive Dashboard**
- **Real-time Analytics**: Live threat intelligence statistics and trends
- **World Map Visualization**: Geographic distribution of cyber threats by victim country
- **Trend Analysis**: Chart-based visualization of threat patterns over time
- **Top Threat Actors**: Ranking of most active threat groups
- **Incident Type Distribution**: Breakdown of attack types and methodologies
- **Filtering & Search**: Advanced filtering by date range, threat actor, vendor, CVE, etc.

### 🔍 **Advanced Study & Analysis**
- **Article Comparison**: Select up to 3 articles for detailed comparative analysis
- **Relationship Mapping**: Interactive network visualization showing connections between threats
- **Timeline Analysis**: Chronological mapping of cyber incidents
- **Common Patterns**: Identification of shared attack vectors and methodologies
- **Threat Intelligence Extraction**: Detailed breakdown of IoCs, vulnerabilities, and recommendations

### 💬 **AI-Powered Chat Interface**
- **Threat Intelligence Q&A**: Chat with AI about cybersecurity threats and trends
- **Context-Aware Responses**: Answers based on crawled threat intelligence database
- **Vector Similarity Search**: Finds relevant articles to support responses
- **Professional Formatting**: Clean, readable responses with citations

### 🗄️ **Data Persistence & Search**
- **PostgreSQL Database**: Robust data storage with full-text search capabilities
- **Vector Embeddings**: Semantic similarity search using Azure OpenAI embeddings
- **Data Export**: JSON and CSV export capabilities
- **Historical Analysis**: Long-term trend analysis and pattern recognition

## 🏗️ Architecture

```
Frontend (React + TypeScript)
├── Dashboard (Analytics & Visualization)
├── Crawler (Web Crawling Interface)
├── Study (Article Analysis & Comparison)
└── Chat (AI Q&A Interface)

Backend (Node.js + Express)
├── WebSocket Server (Real-time updates)
├── Crawlee Service (Advanced web crawling)
├── AI Processing (OpenAI/Azure OpenAI integration)
├── Database Service (PostgreSQL with vector search)
└── REST API (Data access & filtering)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (AWS RDS recommended)
- OpenAI or Azure OpenAI API access

### 1. Clone & Install
```bash
git clone <repository-url>
cd mis2
npm run setup  # Installs both frontend and backend dependencies
```

### 2. Backend Configuration
Create `backend/.env`:
```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database (AWS RDS PostgreSQL)
AWS_RDS_ENDPOINT=your-rds-endpoint.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_USERNAME=your-username
AWS_RDS_PASSWORD=your-password
AWS_RDS_DATABASE=your-database

# AI Services (Choose one)
# Azure OpenAI (Recommended)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-10-21

# OR Standard OpenAI
OPENAI_API_KEY=your_openai_api_key

# Embeddings for Vector Search (Optional but recommended)
AZURE_OPENAI_EMBEDDINGS_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_EMBEDDINGS_API_KEY=your_embeddings_api_key
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT=text-embedding-3-small
AZURE_OPENAI_EMBEDDINGS_API_VERSION=2023-05-15
```

### 3. Install Playwright Browsers
```bash
npm run install:browsers
```

### 4. Start the Application
```bash
# Start both frontend and backend
npm run dev:full

# OR start separately
npm run backend:dev  # Backend on port 3001
npm run dev          # Frontend on port 5173
```

### 5. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 🔧 Detailed Features

### Web Crawling Capabilities

#### **Bot Detection Bypass**
- Navigator property overrides to remove webdriver signatures
- Realistic browser headers and user agents
- Human behavior simulation (mouse movements, scrolling)
- Cookie and session management
- Enhanced stealth mode for financial and news sites

#### **Content Extraction**
- Multi-selector content extraction (articles, headlines, links)
- Pagination handling with automatic "Next" link following
- Infinite scroll detection and handling
- Screenshot capture with auto-cleanup (5 min default)
- Content quality filtering and deduplication

#### **Site-Specific Optimization**
- Auto-detection of strict sites (Bloomberg, WSJ, etc.)
- Adaptive configuration based on site type
- Rate limiting and retry mechanisms
- Concurrent crawling with session management

### AI Processing Pipeline

#### **Content Analysis**
- Quality filtering removes low-value content
- Deduplication by title and content similarity
- Batch processing (20 items per batch, max 100 items)
- Full-text extraction for comprehensive analysis

#### **Threat Intelligence Extraction**
- **Risk Assessment**: 0-10 scoring based on threat severity
- **Event Classification**: 12 categories from CYBER_ATTACK to ZERO_DAY_EXPLOIT
- **Actor Identification**: Extracts threat group names and attributes
- **Victim Analysis**: Identifies targets by organization and geography
- **Technical Indicators**: IOCs, domains, IPs, file hashes
- **Vulnerability Mapping**: CVE identification and impact assessment

### Database & Search Features

#### **Vector Similarity Search**
- Semantic search using Azure OpenAI embeddings
- Context-aware article retrieval for chat responses
- Similar article recommendations
- Configurable similarity thresholds

#### **Advanced Filtering**
- Date range filtering with custom periods
- Multi-dimensional filtering (threat actor, vendor, CVE, incident type)
- Full-text search across titles and content
- Export capabilities (JSON/CSV) with filtered results

### Real-time Features

#### **WebSocket Communication**
- Live crawling progress and statistics
- Real-time log streaming with severity levels
- Screenshot updates with base64 encoding
- Phase tracking (Initializing → Crawling → Processing → Completed)

#### **Interactive Visualizations**
- World map with threat distribution by country
- Time-series charts for trend analysis
- Network graphs for threat relationship mapping
- Expandable content with click-to-reveal functionality

## 📊 Usage Workflows

### 1. **Threat Intelligence Gathering**
1. Navigate to Crawler tab
2. Select predefined cybersecurity sources or enter custom URLs
3. Choose appropriate crawling preset (Default/Bloomberg/Fast)
4. Monitor real-time progress with live logs and screenshots
5. Review filtered results and AI-processed threat intelligence

### 2. **Dashboard Analytics**
1. Access Dashboard for overview of threat landscape
2. Use filters to focus on specific time periods or threat types
3. Analyze geographic distribution via world map
4. Export filtered data for external analysis

### 3. **Deep Threat Analysis**
1. Use Study tab to select up to 3 related articles
2. Generate AI-powered comparative analysis
3. Explore relationship networks and common patterns
4. Review timeline analysis and threat evolution

### 4. **Interactive Q&A**
1. Access Chat interface for threat intelligence queries
2. Ask specific questions about threat actors, vulnerabilities, or trends
3. Receive context-aware responses based on crawled intelligence
4. Follow up with related questions for deeper analysis

## 🛠️ Advanced Configuration

### Crawling Presets

#### **Default Configuration**
- Balanced crawling with moderate stealth
- 5 concurrent sessions, 50 max requests
- JavaScript enabled, images disabled
- 3-second delays between requests

#### **Bloomberg/Strict Sites**
- Enhanced stealth for financial and news sites
- Reduced concurrency (2 sessions)
- Extended delays and retry mechanisms
- Advanced bot detection bypass

#### **Fast Crawling**
- Optimized for speed on regular sites
- Higher concurrency (8 sessions)
- Reduced delays and timeouts
- Minimal stealth overhead

### AI Processing Limits
- Maximum 100 articles per crawl for AI processing
- Batch processing in groups of 20
- Content truncation to 1000 words for performance
- Automatic fallback to content extraction if AI unavailable

## 🔍 Performance & Limitations

### **Capabilities**
- Handles multiple predefined sites sequentially
- Built-in rate limiting and retry mechanisms
- Memory management with auto-cleanup
- Comprehensive error handling and logging

### **Limitations**
- AI processing limited to 100 items per crawl
- Screenshot auto-cleanup after 5 minutes
- Some sites may require custom configuration
- Rate limiting may slow crawling on strict sites

## 🐛 Troubleshooting

### Common Issues

#### **503/403 Errors**
- Use "Bloomberg/Strict Sites" preset
- Reduce concurrent sessions
- Increase delays between requests

#### **No AI Processing**
- Verify OpenAI/Azure OpenAI environment variables
- Check API key validity and quota
- Ensure deployment names match configuration

#### **Database Connection Issues**
- Verify PostgreSQL connection parameters
- Check AWS RDS security group settings
- Ensure SSL is properly configured

#### **Memory Issues**
- Enable screenshot auto-cleanup
- Reduce max requests per crawl
- Monitor system resources during large crawls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper TypeScript typing
4. Test thoroughly with both frontend and backend
5. Submit a pull request with detailed description

## 📄 License

[Add your license information here]

## 🔒 Security Considerations

- Store API keys securely in environment variables
- Use HTTPS in production environments
- Implement proper CORS configuration
- Regular security updates for dependencies
- Monitor API usage and costs

---

**Built with**: React, TypeScript, Node.js, Express, Socket.IO, Playwright, Crawlee, PostgreSQL, OpenAI, Tailwind CSS
