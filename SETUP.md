# Advanced Cyber Intelligence Crawler - Setup Guide

## Overview

This application is now a fully TypeScript-based advanced web crawler that converts your original Python Crawlee functionality to TypeScript. It provides:

- **Enhanced URL Input**: Advanced configuration options, predefined cybersecurity sources, multiple crawling presets
- **Real-time Progress Tracking**: Live logs, screenshots with auto-cleanup (5min), detailed statistics
- **Filtered Results Display**: Quality-filtered URLs and content with search, sorting, and export capabilities
- **AI-Processed Cybersecurity Intelligence**: OpenAI-powered threat analysis with risk assessment

## Quick Start

1. **Install Dependencies** (already done):
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory with the following:

   ```env
   # Azure OpenAI Configuration (Recommended)
   AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
   AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
   AZURE_OPENAI_API_VERSION=2024-02-15-preview

   # Alternative: Regular OpenAI Configuration
   # OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Start the Application**:
   ```bash
   npm run dev
   ```

## Features

### 🎯 Enhanced URL Input
- **Target URL**: Enter any website URL for crawling
- **Predefined Sources**: Quick selection of popular cybersecurity sites (Hacker News, ThreatPost, Krebs, etc.)
- **Configuration Presets**:
  - **Default**: Balanced crawling with moderate stealth
  - **Bloomberg/Strict Sites**: Enhanced stealth for financial/strict sites
  - **Fast Crawling**: Optimized for speed on regular sites
- **Advanced Configuration**: Fine-tune crawling parameters (max pages, timeouts, human behavior simulation, etc.)

### 📊 Real-time Progress Tracking
- **Live Phase Indicators**: Initializing → Crawling → Processing → Saving → Completed
- **Progress Bar**: Real-time completion percentage
- **Statistics Dashboard**: Pages crawled, items extracted, filtered content, cybersecurity articles
- **Screenshot Management**: 
  - Auto-capture during crawling
  - View, download, or manually delete
  - **Auto-cleanup after 5 minutes** (configurable)
- **Live Logs**: Real-time crawling logs with different severity levels
- **Cancel Capability**: Stop crawling at any time

### 🔍 Filtered Results Display
- **Quality Filtering**: Removes social media links, navigation elements, low-quality content
- **Search & Filter**: Search titles, URLs, content; filter by content type
- **Sorting**: Sort by title, URL, date, content length, type
- **Pagination**: Handle large result sets efficiently  
- **Export Options**: JSON and CSV export with full data
- **URL Management**: Copy URLs, open in new tabs

### 🧠 AI-Processed Cybersecurity Intelligence
- **Threat Analysis**: AI-powered analysis using Azure OpenAI/OpenAI GPT-4
- **Risk Assessment**: 0-10 risk scoring for each article
- **Event Classification**: CYBER_ATTACK, DATA_BREACH, MALWARE_CAMPAIGN, VULNERABILITY_DISCLOSURE, etc.
- **Threat Intelligence Extraction**:
  - **Threat Actors**: Identified attackers and threat groups
  - **Victims/Targets**: Organizations and sectors affected
  - **Vulnerabilities**: CVEs and security flaws mentioned
  - **Keywords**: Relevant cybersecurity terms
- **Keppel-Specific Analysis**: Risk assessment for Keppel-related implications
- **Confidence Scoring**: AI confidence in the analysis
- **Advanced Filtering**: Filter by event type, risk level, search across all fields
- **Detailed Views**: Expandable article details with full threat intelligence

### 🛡️ Advanced Crawling Capabilities

#### Bot Detection Bypass
- **Navigator Property Overrides**: Removes webdriver signatures
- **Realistic Headers**: Mimics real browser requests  
- **Human Behavior Simulation**: Random mouse movements, scrolling patterns
- **Stealth Mode**: Enhanced techniques for strict sites

#### Site-Specific Optimization
- **Auto-Detection**: Automatically detects strict sites (Bloomberg, WSJ, etc.)
- **Adaptive Configuration**: Applies appropriate settings per site
- **Enhanced Stealth**: Special handling for financial and news sites

#### Content Extraction
- **Comprehensive Selectors**: Extracts articles, links, headlines, clickable content
- **Pagination Handling**: Automatically follows "Next" links up to configured limit
- **Infinite Scroll**: Handles dynamically loaded content
- **Content Quality**: Length-based filtering and relevance scoring

#### Screenshot Management
- **Auto-Capture**: Takes screenshots during crawling process
- **Base64 Storage**: Efficient in-memory storage
- **5-Minute Auto-Cleanup**: Automatically deletes old screenshots
- **Manual Management**: View, download, or delete screenshots manually
- **Size Tracking**: Monitor screenshot file sizes

## Environment Variables

### Required for AI Processing
- `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key
- `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint URL
- `AZURE_OPENAI_DEPLOYMENT_NAME`: Deployment name (e.g., "gpt-4")
- `AZURE_OPENAI_API_VERSION`: API version (e.g., "2024-02-15-preview")

### Alternative OpenAI Configuration  
- `OPENAI_API_KEY`: Your OpenAI API key (if not using Azure)

### Optional
- The crawler works without AI configuration but won't process content with AI
- All extracted content will still be available in filtered results

## Usage Workflow

1. **Start**: Enter a URL or select predefined cybersecurity sources
2. **Configure**: Choose crawling preset or customize advanced settings
3. **Monitor**: Watch real-time progress, logs, and screenshots
4. **Review**: Examine filtered URLs and AI-processed cybersecurity intelligence
5. **Export**: Download results in JSON or CSV format
6. **Repeat**: Start new crawls or modify configurations

## Technical Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Crawler**: TypeScript Crawlee with Playwright
- **AI Integration**: Azure OpenAI / OpenAI GPT-4
- **State Management**: React hooks with real-time updates
- **Type Safety**: Comprehensive TypeScript types for all data structures

## Performance & Limitations

- **Concurrent Crawling**: Handles multiple predefined sites sequentially
- **Rate Limiting**: Built-in delays and retry mechanisms
- **Memory Management**: Screenshot auto-cleanup prevents memory issues
- **AI Processing**: Batched processing (20 items per batch, max 5 batches = 100 items)
- **Stealth Capabilities**: Advanced bot detection bypass for most sites

## Troubleshooting

### Common Issues
1. **503/403 Errors**: Use "Bloomberg/Strict Sites" preset for enhanced stealth
2. **No AI Processing**: Check environment variables are set correctly  
3. **Slow Crawling**: Use "Fast Crawling" preset for speed optimization
4. **Memory Issues**: Screenshots auto-cleanup after 5 minutes

### Configuration Tips
- **For News Sites**: Use Default or Fast preset
- **For Financial Sites**: Use Bloomberg/Strict Sites preset
- **For Multiple Sites**: Select multiple predefined sources
- **For Custom Sites**: Enter specific URLs with appropriate presets

Your entire application is now pure TypeScript with no Python dependencies! 🚀 