import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { CrawlConfig, CrawlUpdate, WebSocketEvents } from './types/crawling';
import { AdvancedCrawleeCrawler } from './services/crawler';
import { testDatabaseConnection, getDatabaseService } from './services/database';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer<WebSocketEvents>(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || "http://localhost:5173", "https://corvus-blue.vercel.app"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL || "http://localhost:5173", "https://corvus-blue.vercel.app"],
  methods: ["GET", "POST"]
}));
app.use(express.json({ limit: '50mb' }));

// Store active crawlers by socket ID
const activeCrawlers = new Map<string, AdvancedCrawleeCrawler>();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    activeCrawlers: activeCrawlers.size
  });
});

// Database connection test endpoint
app.get('/api/database/test', async (req, res) => {
  try {
    const isConnected = await testDatabaseConnection();
    res.json({
      connected: isConnected,
      timestamp: new Date().toISOString(),
      message: isConnected ? 'Database connection successful' : 'Database connection failed'
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      timestamp: new Date().toISOString(),
      message: 'Database connection error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get default configurations endpoint
app.get('/api/configs', (req, res) => {
  const { getDefaultConfig, getBloombergConfig, getFastConfig } = require('./services/crawler');
  
  res.json({
    default: getDefaultConfig(),
    bloomberg: getBloombergConfig(),
    fast: getFastConfig()
  });
});

// Dashboard data endpoint
app.post('/api/dashboard-data', async (req, res) => {
  try {
    const filters = req.body || {};
    const db = getDatabaseService();
    
    const dashboardData = await db.getDashboardData(filters);
    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Filter options endpoint
app.get('/api/filter-options', async (req, res) => {
  try {
    const db = getDatabaseService();
    const filterOptions = await db.getFilterOptions();
    res.json(filterOptions);
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({
      error: 'Failed to fetch filter options',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Vector similarity search endpoint
app.post('/api/search/similar', async (req, res) => {
  try {
    const { query, limit = 10, threshold = 0.7 } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Query text is required'
      });
    }
    
    const db = getDatabaseService();
    const similarArticles = await db.searchSimilarArticles(query, limit, threshold);
    
    res.json({
      query,
      results: similarArticles,
      count: similarArticles.length,
      threshold,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in similarity search:', error);
    res.status(500).json({
      error: 'Failed to perform similarity search',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Find similar articles to a specific article
app.get('/api/articles/:id/similar', async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 5;
    
    if (isNaN(articleId)) {
      return res.status(400).json({
        error: 'Invalid article ID',
        message: 'Article ID must be a number'
      });
    }
    
    const db = getDatabaseService();
    const similarArticles = await db.findSimilarToArticle(articleId, limit);
    
    res.json({
      articleId,
      similarArticles,
      count: similarArticles.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error finding similar articles:', error);
    res.status(500).json({
      error: 'Failed to find similar articles',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Chat endpoint for cybersecurity Q&A with streaming
app.post('/api/chat', async (req, res) => {
  console.log('🔍 Chat endpoint hit with request:', req.body);
  
  try {
    const { message, stream = true } = req.body;
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      console.log('❌ Invalid message in chat request');
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Message is required'
      });
    }
    
    console.log(`🤖 Processing chat request: "${message}" (streaming: ${stream})`);
    
    // Get database service for similarity search
    const db = getDatabaseService();
    
    // Search for relevant articles using vector similarity (with full main_text for chat context)
    const relevantArticles = await db.searchSimilarArticlesForChat(message.trim(), 3, 0.6);
    
    console.log(`📚 Found ${relevantArticles.length} relevant articles for context`);
    
    // Initialize AI client
    const aiConfig = {
      useAzureOpenAI: true,
      azureOpenaiApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenaiEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
      azureOpenaiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
      openaiApiKey: process.env.OPENAI_API_KEY
    };
    
    const { OpenAI } = require('openai');
    let aiClient;
    
    if (aiConfig.useAzureOpenAI && aiConfig.azureOpenaiApiKey && aiConfig.azureOpenaiEndpoint) {
      aiClient = new OpenAI({
        apiKey: aiConfig.azureOpenaiApiKey,
        baseURL: `${aiConfig.azureOpenaiEndpoint}/openai/deployments/${aiConfig.azureOpenaiDeploymentName}`,
        defaultQuery: { 'api-version': '2024-10-21' },
        defaultHeaders: {
          'api-key': aiConfig.azureOpenaiApiKey,
        },
      });
    } else if (aiConfig.openaiApiKey) {
      aiClient = new OpenAI({ apiKey: aiConfig.openaiApiKey });
    } else {
      return res.status(500).json({
        error: 'AI service not configured',
        message: 'No OpenAI or Azure OpenAI API key found'
      });
    }
    
    // Create context from relevant articles
    let contextText = '';
    if (relevantArticles.length > 0) {
      contextText = relevantArticles.map((article, index) => `
Article ${index + 1}:
Title: ${article.title}
Source: ${article.source} (${new Date(article.published_date).toLocaleDateString()})
Content: ${article.main_text}
Threat Actor: ${article.threat_actor || 'Unknown'}
Victim: ${article.victim || 'Unknown'}
Vulnerabilities: ${JSON.stringify(article.vulnerabilities)}
---`).join('\n');
    }
    
    // Enhanced AI prompt for better formatting
    const systemPrompt = `You are an expert cybersecurity intelligence analyst with access to a comprehensive threat intelligence database. Your role is to provide accurate, insightful answers about cybersecurity threats, vulnerabilities, attack trends, and defensive strategies.

Guidelines for responses:
1. Always base your answers on the provided article context when available
2. Be specific about threat actors, attack methods, and targets mentioned in the articles
3. Provide actionable insights and recommendations
4. Use clear, professional formatting without excessive markdown
5. Structure your response with clear sections and numbered points when appropriate
6. Highlight important dates, CVEs, and IOCs when mentioned
7. Always cite which articles your information comes from
8. Avoid using excessive asterisks (**) - use clear headings instead
9. Keep formatting clean and readable

Context from Intelligence Database:
${contextText || 'No specific articles found for this query.'}`;

    const userPrompt = `Based on the cybersecurity intelligence in the context above, please answer this question: ${message}

Please format your response clearly with:
- Clear section headings (without excessive asterisks)
- Numbered lists for key points
- Specific references to the source articles when applicable
- Professional, readable formatting

If the context contains relevant information, reference the specific articles and provide detailed insights. If not, provide general cybersecurity knowledge while noting the limitation.`;

    console.log('🤖 Generating AI response...');
    
    if (stream) {
      // Set up Server-Sent Events for streaming
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send sources first
      const sources = relevantArticles.map(article => ({
        id: article.id,
        title: article.title,
        source: article.source,
        published_date: article.published_date,
        similarity: article.similarity,
        url: article.url || '',
        snippet: article.main_text ? article.main_text.slice(0, 200) + '...' : 'No content preview available'
      }));

      res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);

      try {
        const stream = await aiClient.chat.completions.create({
          model: aiConfig.useAzureOpenAI ? 'gpt-4' : 'gpt-4',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.2,
          max_tokens: 2000,
          stream: true
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            res.write(`data: ${JSON.stringify({ type: 'content', content })}\n\n`);
          }
        }

        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
        
      } catch (error) {
        console.error('Streaming error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to generate response' })}\n\n`);
        res.end();
      }
    } else {
      // Fallback to non-streaming response
      const response = await aiClient.chat.completions.create({
        model: aiConfig.useAzureOpenAI ? 'gpt-4' : 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      });
      
      const aiResponse = response.choices[0]?.message?.content?.trim() || 'I apologize, but I was unable to generate a response. Please try again.';
      
      // Format sources for frontend
      const sources = relevantArticles.map(article => ({
        id: article.id,
        title: article.title,
        source: article.source,
        published_date: article.published_date,
        similarity: article.similarity,
        url: article.url || '',
        snippet: article.main_text ? article.main_text.slice(0, 200) + '...' : 'No content preview available'
      }));
      
      console.log(`✅ Chat response generated with ${sources.length} sources`);
      
      res.json({
        response: aiResponse,
        sources: sources,
        query: message,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({
      error: 'Failed to process chat request',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Articles endpoint with filtering for Study component
app.get('/api/articles', async (req, res) => {
  try {
    const db = getDatabaseService();
    
    // Build filters from query parameters
    const filters: any = {};
    
    if (req.query.source) filters.source = req.query.source;
    if (req.query.incidentType) filters.incidentType = req.query.incidentType;
    if (req.query.threatActor) filters.threatActor = req.query.threatActor;
    if (req.query.search) filters.search = req.query.search;
    
    // Get dashboard data with filters applied
    const dashboardData = await db.getDashboardData(filters);
    
    // Format articles for Study component
    const articles = dashboardData.recentArticles.map((article: any) => ({
      id: article.id,
      title: article.title,
      source: article.source || 'Unknown',
      threat_actor: article.threat_actor || 'Unknown',
      victim: article.victim || 'Unknown',
      vulnerabilities: Array.isArray(article.vulnerabilities) ? article.vulnerabilities : [],
      tags: Array.isArray(article.tags) ? article.tags : [],
      published_date: article.published_date || article.date,
      url: article.url || '',
      main_text: '', // Will be loaded when needed for analysis
      incident_type: Array.isArray(article.incident_type) ? article.incident_type : [],
      impact: Array.isArray(article.impact) ? article.impact : []
    }));
    
    res.json({
      articles,
      total: articles.length,
      filters: filters
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Schedule management endpoints
interface ScheduleConfig {
  id: string;
  name: string;
  urls: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timezone: string;
  enabled: boolean;
  crawlerConfig: {
    maxRequestsPerCrawl: number;
    enableAI: boolean;
    enableScreenshots: boolean;
    maxConcurrency: number;
  };
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'error' | 'running';
  createdAt: string;
  updatedAt: string;
}

// In-memory storage for schedules (you can replace with database later)
let schedules: ScheduleConfig[] = [];

// Get all schedules
app.get('/api/schedules', (req, res) => {
  res.json(schedules);
});

// Create new schedule
app.post('/api/schedules', (req, res) => {
  try {
    const scheduleData = req.body;
    const newSchedule: ScheduleConfig = {
      ...scheduleData,
      id: scheduleData.id || Date.now().toString(),
      status: 'active',
      createdAt: scheduleData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    schedules.push(newSchedule);
    console.log('Created new schedule:', newSchedule.name);
    res.status(201).json(newSchedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      error: 'Failed to create schedule',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Update schedule
app.put('/api/schedules/:id', (req, res) => {
  try {
    const scheduleId = req.params.id;
    const updateData = req.body;
    
    const scheduleIndex = schedules.findIndex(s => s.id === scheduleId);
    if (scheduleIndex === -1) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    schedules[scheduleIndex] = {
      ...schedules[scheduleIndex],
      ...updateData,
      id: scheduleId,
      updatedAt: new Date().toISOString()
    };
    
    console.log('Updated schedule:', schedules[scheduleIndex].name);
    res.json(schedules[scheduleIndex]);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      error: 'Failed to update schedule',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Delete schedule
app.delete('/api/schedules/:id', (req, res) => {
  try {
    const scheduleId = req.params.id;
    const initialLength = schedules.length;
    
    schedules = schedules.filter(s => s.id !== scheduleId);
    
    if (schedules.length === initialLength) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    console.log('Deleted schedule:', scheduleId);
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      error: 'Failed to delete schedule',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Toggle schedule enabled/disabled
app.post('/api/schedules/:id/toggle', (req, res) => {
  try {
    const scheduleId = req.params.id;
    const { enabled } = req.body;
    
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    schedule.enabled = enabled;
    schedule.status = enabled ? 'active' : 'paused';
    schedule.updatedAt = new Date().toISOString();
    
    console.log(`Toggled schedule ${schedule.name}: ${enabled ? 'enabled' : 'disabled'}`);
    res.json(schedule);
  } catch (error) {
    console.error('Error toggling schedule:', error);
    res.status(500).json({
      error: 'Failed to toggle schedule',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Run schedule now
app.post('/api/schedules/:id/run', async (req, res) => {
  try {
    const scheduleId = req.params.id;
    
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Update schedule status
    schedule.status = 'running';
    schedule.lastRun = new Date().toISOString();
    schedule.updatedAt = new Date().toISOString();
    
    console.log(`Running schedule now: ${schedule.name}`);
    
    // TODO: Integrate with Lambda function here
    // For now, simulate running
    setTimeout(() => {
      schedule.status = 'active';
      console.log(`Schedule completed: ${schedule.name}`);
    }, 5000);
    
    res.json({ 
      success: true, 
      message: 'Schedule started',
      schedule: schedule
    });
  } catch (error) {
    console.error('Error running schedule:', error);
    res.status(500).json({
      error: 'Failed to run schedule',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Study analysis endpoint
app.post('/api/study/analyze', async (req, res) => {
  try {
    const { articles } = req.body;
    
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Articles array is required and must contain at least one article'
      });
    }
    
    if (articles.length > 3) {
      return res.status(400).json({
        error: 'Too many articles',
        message: 'Maximum 3 articles allowed for analysis'
      });
    }
    
    // First, get the full article content from database
    const db = getDatabaseService();
    const fullArticles = [];
    
    for (const article of articles) {
      try {
        const fullArticleData = await db.getArticleById(article.id);
        if (fullArticleData) {
          fullArticles.push({
            ...article,
            content: fullArticleData.main_text || article.content || '',
            main_text: fullArticleData.main_text || article.content || ''
          });
        } else {
          fullArticles.push(article);
        }
      } catch (error) {
        console.error(`Error fetching full article ${article.id}:`, error);
        fullArticles.push(article);
      }
    }
    
    // Initialize AI client for analysis
    const aiConfig = {
      useAzureOpenAI: true,
      azureOpenaiApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenaiEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
      azureOpenaiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
      openaiApiKey: process.env.OPENAI_API_KEY
    };
    
    const { OpenAI } = require('openai');
    let aiClient;
    
    if (aiConfig.useAzureOpenAI && aiConfig.azureOpenaiApiKey && aiConfig.azureOpenaiEndpoint) {
      aiClient = new OpenAI({
        apiKey: aiConfig.azureOpenaiApiKey,
        baseURL: `${aiConfig.azureOpenaiEndpoint}/openai/deployments/${aiConfig.azureOpenaiDeploymentName}`,
        defaultQuery: { 'api-version': '2024-10-21' },
        defaultHeaders: {
          'api-key': aiConfig.azureOpenaiApiKey,
        },
      });
    } else if (aiConfig.openaiApiKey) {
      aiClient = new OpenAI({ apiKey: aiConfig.openaiApiKey });
    } else {
      return res.status(500).json({
        error: 'AI service not configured',
        message: 'No OpenAI or Azure OpenAI API key found'
      });
    }
    
    // Create comprehensive analysis prompt
    const analysisPrompt = `You are an expert cybersecurity intelligence analyst. Analyze the following ${fullArticles.length} cybersecurity articles and provide a comprehensive study report.

Articles to analyze:
${fullArticles.map((article, index) => `
Article ${index + 1}:
Title: ${article.title}
Published: ${article.published_date}
Source: ${article.source}
Threat Actor: ${article.threat_actor}
Victim: ${article.victim}
Content: ${article.content || article.main_text || 'Content not available'}
---
`).join('\n')}

Provide your analysis in the following JSON format:
{
  "keyPoints": [
    {
      "articleId": ${fullArticles[0].id},
      "title": "Article title",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
      "summary": "2-3 sentence summary of the article focusing on the cyber threat",
      "timeline": "When the incident occurred or was discovered (be specific if mentioned)",
      "impact": "Assessment of the impact and significance",
      "threatActors": ["Specific threat actor names mentioned"],
      "victims": ["Organizations or sectors targeted"],
      "attackVectors": ["Methods of attack used"],
      "indicators": ["IOCs, domains, IPs, or other technical indicators"]
    }
  ],
  "relationships": {
    "commonThemes": ["Advanced Persistent Threat", "Ransomware Attack", "Data Breach", "Supply Chain Attack"],
    "connectionPoints": ["Shared attack techniques", "Similar targeting patterns", "Related infrastructure"],
    "sharedActors": ["Threat actors mentioned across multiple articles"],
    "sharedVictims": ["Organizations mentioned in multiple incidents"],
    "timeline": [
      {
        "date": "YYYY-MM-DD",
        "event": "Specific event or discovery",
        "articleId": ${fullArticles[0].id}
      }
    ]
  }
}

Instructions:
1. Extract 4-5 detailed key points from each article
2. Identify specific threat actors, victims, and attack methods mentioned
3. Find connections and patterns between the articles
4. Extract technical indicators when mentioned (domains, IPs, hashes, etc.)
5. Create a detailed timeline of when events occurred
6. Focus on cybersecurity-specific analysis
7. Be specific about threat actor names, victim organizations, and attack techniques
8. Return ONLY valid JSON, no additional text.`;

    console.log('Sending analysis request to AI...');
    
    const response = await aiClient.chat.completions.create({
      model: aiConfig.useAzureOpenAI ? 'gpt-4' : 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert cybersecurity intelligence analyst. Return only valid JSON.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 16000
    });
    
    const aiResponse = response.choices[0]?.message?.content?.trim() || '';
    console.log('AI Response received, parsing...');
    
    // Parse AI response
    let analysisResult;
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      analysisResult = JSON.parse(jsonMatch[0]);
      
      // Validate and enhance the response
      if (!analysisResult.keyPoints) analysisResult.keyPoints = [];
      if (!analysisResult.relationships) analysisResult.relationships = { commonThemes: [], connectionPoints: [], timeline: [] };
      if (!analysisResult.visualization) analysisResult.visualization = { nodes: [], edges: [] };
      
      console.log('Analysis completed successfully');
      
    } catch (error) {
      console.error('Error parsing AI response:', error);
      
      // Fallback analysis if AI parsing fails
      analysisResult = {
        keyPoints: fullArticles.map((article, index) => ({
          articleId: article.id,
          title: article.title,
          keyPoints: [
            'Cybersecurity incident detected',
            'Investigation ongoing',
            'Potential impact assessment required',
            'Further analysis needed',
            'Security implications identified'
          ],
          summary: `Analysis of ${article.title} - This article discusses a cybersecurity incident involving ${article.threat_actor || 'unknown actors'} targeting ${article.victim || 'multiple organizations'}.`,
          timeline: article.published_date || 'Date unknown',
          impact: 'Impact assessment pending',
          threatActors: article.threat_actor ? [article.threat_actor] : ['Unknown'],
          victims: article.victim ? [article.victim] : ['Multiple Organizations'],
          attackVectors: ['Unspecified attack method'],
          indicators: ['No technical indicators available']
        })),
        relationships: {
          commonThemes: ['Cybersecurity', 'Threat Intelligence', 'Incident Response'],
          connectionPoints: ['Common threat actors', 'Similar attack vectors'],
          sharedActors: fullArticles.map(a => a.threat_actor).filter(Boolean),
          sharedVictims: fullArticles.map(a => a.victim).filter(Boolean),
          timeline: fullArticles.map(article => ({
            date: article.published_date || '2024-01-01',
            event: `Incident reported: ${article.title.substring(0, 50)}...`,
            articleId: article.id
          }))
        }
      };
    }
    
    res.json(analysisResult);
    
  } catch (error) {
    console.error('Error in study analysis:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Handle crawl start
  socket.on('crawl:start', async ({ urls, config }) => {
    try {
      console.log(`Starting crawl for ${socket.id}:`, urls);
      
      // Stop any existing crawler for this socket
      const existingCrawler = activeCrawlers.get(socket.id);
      if (existingCrawler) {
        existingCrawler.abort();
        activeCrawlers.delete(socket.id);
      }
      
      // Create new crawler with WebSocket update callback
      const updateCallback = (update: CrawlUpdate) => {
        try {
          switch (update.type) {
            case 'log':
              socket.emit('crawl:log', update.payload);
              break;
            case 'stats':
              socket.emit('crawl:progress', { stats: update.payload });
              break;
            case 'progress':
              socket.emit('crawl:phase', { phase: update.payload.phase || 'processing' });
              break;
            case 'screenshot':
              socket.emit('crawl:screenshot', update.payload);
              break;
            case 'data':
              // Send individual items
              if (update.payload.newItems) {
                update.payload.newItems.forEach((item: any) => {
                  socket.emit('crawl:raw-item', item);
                });
              }
              break;
            case 'database-save':
              socket.emit('crawl:database-save', update.payload);
              break;
            case 'complete':
              socket.emit('crawl:completed', { 
                success: true, 
                databaseSaveResult: update.payload.databaseSaveResult 
              });
              // Send all processed items
              if (update.payload.cybersecurityData) {
                update.payload.cybersecurityData.forEach((article: any) => {
                  socket.emit('crawl:processed-item', article);
                });
              }
              activeCrawlers.delete(socket.id);
              break;
            case 'error':
              socket.emit('crawl:error', { error: update.payload.error || 'Unknown error' });
              activeCrawlers.delete(socket.id);
              break;
          }
        } catch (error) {
          console.error('Error sending update:', error);
        }
      };
      
      // Merge environment variables with config
      const enhancedConfig: CrawlConfig = {
        ...config,
        openaiApiKey: config.openaiApiKey || process.env.OPENAI_API_KEY,
        azureOpenaiApiKey: config.azureOpenaiApiKey || process.env.AZURE_OPENAI_API_KEY,
        azureOpenaiEndpoint: config.azureOpenaiEndpoint || process.env.AZURE_OPENAI_ENDPOINT,
        azureOpenaiDeploymentName: config.azureOpenaiDeploymentName || process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      };
      
      const crawler = new AdvancedCrawleeCrawler(enhancedConfig, updateCallback);
      activeCrawlers.set(socket.id, crawler);
      
      // Start crawling
      socket.emit('crawl:phase', { phase: 'initializing' });
      const result = await crawler.crawlWebsite(urls);
      
      if (result.success) {
        console.log(`Crawl completed for ${socket.id}: ${result.cybersecurityData.length} articles found`);
      } else {
        console.error(`Crawl failed for ${socket.id}:`, result.error);
      }
      
    } catch (error) {
      console.error(`Crawl error for ${socket.id}:`, error);
      socket.emit('crawl:error', { 
        error: error instanceof Error ? error.message : 'Unknown crawling error' 
      });
      activeCrawlers.delete(socket.id);
    }
  });
  
  // Handle crawl cancellation
  socket.on('crawl:cancel', () => {
    console.log(`Cancelling crawl for ${socket.id}`);
    const crawler = activeCrawlers.get(socket.id);
    if (crawler) {
      crawler.abort();
      activeCrawlers.delete(socket.id);
      socket.emit('crawl:completed', { success: false, error: 'Cancelled by user' });
    }
  });
  
  // Handle screenshot cleanup
  socket.on('crawl:clear-screenshots', () => {
    console.log(`Clearing screenshots for ${socket.id}`);
    const crawler = activeCrawlers.get(socket.id);
    if (crawler) {
      const cleaned = crawler.cleanupOldScreenshots(0); // Clear all screenshots
      console.log(`Cleaned ${cleaned} screenshots for ${socket.id}`);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    const crawler = activeCrawlers.get(socket.id);
    if (crawler) {
      crawler.abort();
      activeCrawlers.delete(socket.id);
    }
  });
});

// Periodic cleanup of old screenshots
setInterval(() => {
  activeCrawlers.forEach((crawler, socketId) => {
    try {
      const cleaned = crawler.cleanupOldScreenshots(5); // 5 minutes
      if (cleaned > 0) {
        console.log(`Auto-cleaned ${cleaned} screenshots for ${socketId}`);
      }
    } catch (error) {
      console.error(`Error cleaning screenshots for ${socketId}:`, error);
    }
  });
}, 30000); // Check every 30 seconds

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
  console.log(`🚀 MIS2 Crawler Backend Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log configuration status
  if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
    console.log('✅ Azure OpenAI configured');
  } else if (process.env.OPENAI_API_KEY) {
    console.log('✅ OpenAI configured');
  } else {
    console.log('⚠️  No AI service configured - will run in content extraction mode only');
  }
  
  // Test database connection
  try {
    const dbConnected = await testDatabaseConnection();
    if (dbConnected) {
      console.log('✅ AWS PostgreSQL database connected');
    } else {
      console.log('❌ AWS PostgreSQL database connection failed');
    }
  } catch (error) {
    console.log('❌ Database connection error:', error instanceof Error ? error.message : String(error));
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Abort all active crawlers
  activeCrawlers.forEach((crawler, socketId) => {
    console.log(`Aborting crawler for ${socketId}`);
    crawler.abort();
  });
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  
  // Abort all active crawlers
  activeCrawlers.forEach((crawler, socketId) => {
    console.log(`Aborting crawler for ${socketId}`);
    crawler.abort();
  });
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 
