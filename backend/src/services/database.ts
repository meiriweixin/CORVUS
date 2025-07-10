import { Pool, PoolClient } from 'pg';
import { ProcessedArticle } from '../types/crawling';
import crypto from 'crypto';
import { OpenAI } from 'openai';

export interface DatabaseSaveResult {
  articlesSaved: number;
  analysesSaved: number;
  errors?: string[];
}

export class DatabaseService {
  private pool: Pool;
  private isConnected: boolean = false;
  private embeddingsClient?: OpenAI;

  constructor() {
    this.pool = new Pool({
      host: process.env.AWS_RDS_ENDPOINT,
      port: parseInt(process.env.AWS_RDS_PORT || '5432'),
      user: process.env.AWS_RDS_USERNAME,
      password: process.env.AWS_RDS_PASSWORD,
      database: process.env.AWS_RDS_DATABASE,
      ssl: {
        rejectUnauthorized: false // AWS RDS requires SSL
      },
      max: 10, // Maximum number of connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err);
      this.isConnected = false;
    });

    this.pool.on('connect', () => {
      if (!this.isConnected) {
        console.log('✅ Connected to AWS PostgreSQL database');
        this.isConnected = true;
      }
    });

    // Initialize embeddings client
    this.initializeEmbeddingsClient();
  }

  private initializeEmbeddingsClient(): void {
    const endpoint = process.env.AZURE_OPENAI_EMBEDDINGS_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_EMBEDDINGS_API_KEY;
    const deploymentName = process.env.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT;
    const apiVersion = process.env.AZURE_OPENAI_EMBEDDINGS_API_VERSION;

    if (endpoint && apiKey && deploymentName) {
      this.embeddingsClient = new OpenAI({
        apiKey: apiKey,
        baseURL: `${endpoint}/openai/deployments/${deploymentName}`,
        defaultQuery: { 'api-version': apiVersion || '2023-05-15' },
        defaultHeaders: {
          'api-key': apiKey,
        },
      });
      console.log('✅ Azure OpenAI Embeddings client initialized');
    } else {
      console.log('⚠️ Azure OpenAI Embeddings not configured - vectors will not be generated');
    }
  }

  private async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.embeddingsClient) {
      console.log('⚠️ Embeddings client not available');
      return null;
    }

    try {
      // Limit text to reasonable size (most embedding models have token limits)
      const truncatedText = text.slice(0, 8000); // Adjust based on your model's limits
      
      const response = await this.embeddingsClient.embeddings.create({
        model: process.env.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT || 'text-embedding-3-small',
        input: truncatedText,
      });

      return response.data[0]?.embedding || null;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      return null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      console.log('Database connection test successful:', result.rows[0]);
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  private generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  private mapArticleToDbRecord(article: ProcessedArticle) {
    // Helper function to safely clean and stringify array data for JSON columns
    const safeJsonStringify = (data: any[]): string => {
      try {
        // Filter out null, undefined, and empty values
        const cleanData = data.filter(item => 
          item !== null && 
          item !== undefined && 
          item !== '' && 
          typeof item === 'string'
        );
        return JSON.stringify(cleanData);
      } catch (error) {
        console.warn('Failed to stringify array data:', data, error);
        return '[]';
      }
    };

    // Validate that published_date exists and is valid
    const publishedDate = article.articleDate || article.published;
    if (!publishedDate || publishedDate === 'NOT_FOUND') {
      throw new Error(`Article rejected: No valid published date found for "${article.title}"`);
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}/.test(publishedDate)) {
      throw new Error(`Article rejected: Invalid date format for "${article.title}": ${publishedDate}`);
    }

    // Get proper source domain (should already be cleaned from crawler)
    // The 'site' field should contain the original crawled site domain, not the individual article URL domain
    let sourceDomain = article.site || 'unknown';
    if (sourceDomain === 'unknown' && article.sourceUrl) {
      try {
        // Try to get domain from original source URL first
        const sourceUrlObj = new URL(article.sourceUrl);
        sourceDomain = sourceUrlObj.hostname.replace('www.', '');
        console.log(`Using source domain from sourceUrl: ${sourceDomain}`);
      } catch (error) {
        console.warn('Failed to extract source domain from sourceUrl:', article.sourceUrl);
        // Fallback to article URL (but this is not ideal)
        if (article.url) {
          try {
            const urlObj = new URL(article.url);
            sourceDomain = urlObj.hostname.replace('www.', '');
            console.warn(`Fallback: Using article URL domain as source: ${sourceDomain}`);
          } catch (fallbackError) {
            console.warn('Failed to extract source domain from article URL:', article.url);
            sourceDomain = 'unknown';
          }
        }
      }
    }

    // Create enhanced main_text with metadata + content
    const articleTitle = article.articleTitle || article.title || 'Untitled';
    const articleUrl = article.url || '';
    const articleSource = sourceDomain;
    const articlePublishedDate = publishedDate;
    
    // Limit original content to 1000 words
    const originalContent = article.content || '';
    const words = originalContent.split(/\s+/).filter(word => word.length > 0);
    const truncatedContent = words.slice(0, 1000).join(' ');
    
    // Combine metadata with content for enhanced main_text
    const enhancedMainText = [
      `URL: ${articleUrl}`,
      `Source: ${articleSource}`,
      `Title: ${articleTitle}`,
      `Published Date: ${articlePublishedDate}`,
      `Content: ${truncatedContent}`
    ].join('\n\n');

    // Map ProcessedArticle fields to database columns
    return {
      url: articleUrl,
      title: articleTitle.slice(0, 500), // Limit length
      published_date: publishedDate, // Now guaranteed to be valid
      main_text: enhancedMainText, // Enhanced main_text with metadata + content
      victim_country: article.victimCountry || 'Unknown',
      source: sourceDomain, // Always use clean domain name
      incident_type: JSON.stringify([article.eventType || 'UNKNOWN']), // JSON string for JSON column
      affected_product: '[]', // Empty JSON array as string
      vulnerabilities: safeJsonStringify(article.vulnerabilities || []),
      victim: (article.victim || '').slice(0, 200), // Limit length
      impact: JSON.stringify([article.impact || 'medium']), // JSON string for JSON column  
      threat_actor: (article.attacker || '').slice(0, 200), // Limit length
      initial_access_vector: '[]', // Empty JSON array as string
      tags: safeJsonStringify([
        ...(article.keywords || []),
        ...(article.cybersecurityTopics || []),
        article.eventType || 'UNKNOWN'
      ]),
      content_hash: this.generateContentHash(enhancedMainText),
      scrape_timestamp: new Date().toISOString(),
      scrape_success: true,
      error_message: null,
      date: publishedDate // Use the same validated date
    };
  }

  async saveProcessedArticles(articles: ProcessedArticle[]): Promise<DatabaseSaveResult> {
    if (!articles || articles.length === 0) {
      return { articlesSaved: 0, analysesSaved: 0 };
    }

    const client: PoolClient = await this.pool.connect();
    const errors: string[] = [];
    let articlesSaved = 0;

    try {
      await client.query('BEGIN');

      const insertQuery = `
        INSERT INTO public.articles (
          url, title, published_date, main_text, victim_country, source,
          incident_type, affected_product, vulnerabilities, victim,
          impact, threat_actor, initial_access_vector, tags,
          content_hash, scrape_timestamp, scrape_success, error_message, date, vector
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
        ON CONFLICT (content_hash) DO NOTHING
        RETURNING id;
      `;

      for (const article of articles) {
        try {
          // Skip non-cybersecurity articles
          if (!article.cybersecurityRelevant) {
            continue;
          }

          let dbRecord;
          try {
            dbRecord = this.mapArticleToDbRecord(article);
          } catch (mappingError) {
            // Article rejected due to validation (e.g., missing published_date)
            const errorMsg = mappingError instanceof Error ? mappingError.message : String(mappingError);
            console.log(`⚠️ ${errorMsg}`);
            errors.push(errorMsg);
            continue; // Skip this article but continue processing others
          }
          
          // Generate embedding for the enhanced main_text
          console.log(`🔄 Generating embedding for: ${dbRecord.title}`);
          const embedding = await this.generateEmbedding(dbRecord.main_text);
          
          // Convert embedding to PostgreSQL vector format
          let vectorValue = null;
          if (embedding && embedding.length > 0) {
            // PostgreSQL vector format: '[1.0, 2.0, 3.0]'
            vectorValue = `[${embedding.join(',')}]`;
            console.log(`✅ Generated embedding with ${embedding.length} dimensions for: ${dbRecord.title}`);
          } else {
            console.log(`⚠️ Failed to generate embedding for: ${dbRecord.title}`);
          }
          
          // Use savepoint for individual article saves
          await client.query('SAVEPOINT article_save');
          
          try {
            const result = await client.query(insertQuery, [
              dbRecord.url,
              dbRecord.title,
              dbRecord.published_date,
              dbRecord.main_text,
              dbRecord.victim_country,
              dbRecord.source,
              dbRecord.incident_type,
              dbRecord.affected_product,
              dbRecord.vulnerabilities,
              dbRecord.victim,
              dbRecord.impact,
              dbRecord.threat_actor,
              dbRecord.initial_access_vector,
              dbRecord.tags,
              dbRecord.content_hash,
              dbRecord.scrape_timestamp,
              dbRecord.scrape_success,
              dbRecord.error_message,
              dbRecord.date,
              vectorValue
            ]);

            await client.query('RELEASE SAVEPOINT article_save');

            if (result.rows.length > 0) {
              articlesSaved++;
              const vectorStatus = vectorValue ? 'with vector' : 'without vector';
              console.log(`✅ Saved article: ${dbRecord.title} (ID: ${result.rows[0].id}) | Published: ${dbRecord.published_date} | Source: ${dbRecord.source} | ${vectorStatus}`);
            } else {
              console.log(`⚠️ Article already exists (duplicate): ${dbRecord.title}`);
            }
          } catch (insertError) {
            await client.query('ROLLBACK TO SAVEPOINT article_save');
            const errorMsg = `Failed to save article "${article.title || 'Unknown'}": ${insertError instanceof Error ? insertError.message : String(insertError)}`;
            console.error('❌', errorMsg);
            errors.push(errorMsg);
          }
        } catch (error) {
          const errorMsg = `Failed to process article "${article.title || 'Unknown'}": ${error instanceof Error ? error.message : String(error)}`;
          console.error('❌', errorMsg);
          errors.push(errorMsg);
        }
      }

      await client.query('COMMIT');
      console.log(`✅ Database transaction completed. Saved ${articlesSaved} articles.`);

    } catch (error) {
      await client.query('ROLLBACK');
      const errorMsg = `Database transaction failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error('❌', errorMsg);
      errors.push(errorMsg);
    } finally {
      client.release();
    }

    return {
      articlesSaved,
      analysesSaved: 0, // We're only saving to articles table for now
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async getArticleCount(): Promise<number> {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT COUNT(*) FROM public.articles');
      client.release();
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting article count:', error);
      return 0;
    }
  }

  async getRecentArticles(limit: number = 10): Promise<any[]> {
    try {
      const client = await this.pool.connect();
      const result = await client.query(
        'SELECT * FROM public.articles ORDER BY scrape_timestamp DESC LIMIT $1',
        [limit]
      );
      client.release();
      return result.rows;
    } catch (error) {
      console.error('Error getting recent articles:', error);
      return [];
    }
  }

  async getArticleById(id: number): Promise<any | null> {
    try {
      const client = await this.pool.connect();
      const result = await client.query(
        'SELECT * FROM public.articles WHERE id = $1',
        [id]
      );
      client.release();
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting article by ID:', error);
      return null;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    console.log('Database connection pool closed');
  }

  // Vector similarity search
  async searchSimilarArticles(queryText: string, limit: number = 10, threshold: number = 0.7): Promise<any[]> {
    if (!this.embeddingsClient) {
      console.log('⚠️ Embeddings client not available for similarity search');
      return [];
    }

    try {
      // Generate embedding for the query text
      const queryEmbedding = await this.generateEmbedding(queryText);
      if (!queryEmbedding) {
        console.log('⚠️ Failed to generate embedding for query text');
        return [];
      }

      const client = await this.pool.connect();
      
      // Use cosine similarity for vector search
      const searchQuery = `
        SELECT 
          id, title, published_date, source, main_text, threat_actor, victim, 
          incident_type, vulnerabilities, tags, url,
          (vector <=> $1::vector) as distance,
          (1 - (vector <=> $1::vector)) as similarity
        FROM public.articles 
        WHERE vector IS NOT NULL
        ORDER BY vector <=> $1::vector
        LIMIT $2;
      `;

      const vectorParam = `[${queryEmbedding.join(',')}]`;
      const result = await client.query(searchQuery, [vectorParam, limit]);
      client.release();

      // Filter by similarity threshold and format results
      const similarArticles = result.rows
        .filter(row => row.similarity >= threshold)
        .map(row => ({
          id: row.id,
          title: row.title,
          published_date: row.published_date,
          source: row.source,
          main_text: row.main_text.slice(0, 500) + '...', // Truncate for display
          threat_actor: row.threat_actor,
          victim: row.victim,
          incident_type: JSON.parse(row.incident_type || '[]'),
          vulnerabilities: JSON.parse(row.vulnerabilities || '[]'),
          tags: JSON.parse(row.tags || '[]'),
          url: row.url,
          similarity: parseFloat(row.similarity).toFixed(3)
        }));

      console.log(`🔍 Found ${similarArticles.length} similar articles for query: "${queryText}"`);
      return similarArticles;

    } catch (error) {
      console.error('Error in vector similarity search:', error);
      return [];
    }
  }

  // Vector similarity search for chat (returns full main_text for AI context)
  async searchSimilarArticlesForChat(queryText: string, limit: number = 3, threshold: number = 0.6): Promise<any[]> {
    if (!this.embeddingsClient) {
      console.log('⚠️ Embeddings client not available for chat similarity search');
      return [];
    }

    try {
      // Generate embedding for the query text
      const queryEmbedding = await this.generateEmbedding(queryText);
      if (!queryEmbedding) {
        console.log('⚠️ Failed to generate embedding for chat query text');
        return [];
      }

      const client = await this.pool.connect();
      
      // Use cosine similarity for vector search - include URL for source links
      const searchQuery = `
        SELECT 
          id, title, published_date, source, main_text, threat_actor, victim, 
          incident_type, vulnerabilities, tags, url,
          (vector <=> $1::vector) as distance,
          (1 - (vector <=> $1::vector)) as similarity
        FROM public.articles 
        WHERE vector IS NOT NULL
        ORDER BY vector <=> $1::vector
        LIMIT $2;
      `;

      const vectorParam = `[${queryEmbedding.join(',')}]`;
      const result = await client.query(searchQuery, [vectorParam, limit]);
      client.release();

      // Filter by similarity threshold and format results with FULL main_text for AI context
      const similarArticles = result.rows
        .filter(row => row.similarity >= threshold)
        .map(row => {
          // Safe JSON parsing with fallbacks
          let incident_type = [];
          let vulnerabilities = [];
          let tags = [];
          
          try {
            if (row.incident_type) {
              if (typeof row.incident_type === 'string') {
                // If it's a string, try to parse as JSON, if fails treat as single item array
                try {
                  incident_type = JSON.parse(row.incident_type);
                  if (!Array.isArray(incident_type)) {
                    incident_type = [row.incident_type];
                  }
                } catch {
                  // If JSON parse fails, treat the string as a single item
                  incident_type = [row.incident_type];
                }
              } else {
                incident_type = Array.isArray(row.incident_type) ? row.incident_type : [row.incident_type];
              }
            }
          } catch (error) {
            console.warn(`Failed to parse incident_type for article ${row.id}:`, error);
            incident_type = [];
          }
          
          try {
            if (row.vulnerabilities) {
              if (typeof row.vulnerabilities === 'string') {
                try {
                  vulnerabilities = JSON.parse(row.vulnerabilities);
                  if (!Array.isArray(vulnerabilities)) {
                    vulnerabilities = [row.vulnerabilities];
                  }
                } catch {
                  vulnerabilities = [row.vulnerabilities];
                }
              } else {
                vulnerabilities = Array.isArray(row.vulnerabilities) ? row.vulnerabilities : [row.vulnerabilities];
              }
            }
          } catch (error) {
            console.warn(`Failed to parse vulnerabilities for article ${row.id}:`, error);
            vulnerabilities = [];
          }
          
          try {
            if (row.tags) {
              if (typeof row.tags === 'string') {
                try {
                  tags = JSON.parse(row.tags);
                  if (!Array.isArray(tags)) {
                    tags = [row.tags];
                  }
                } catch {
                  tags = [row.tags];
                }
              } else {
                tags = Array.isArray(row.tags) ? row.tags : [row.tags];
              }
            }
          } catch (error) {
            console.warn(`Failed to parse tags for article ${row.id}:`, error);
            tags = [];
          }
          
          return {
            id: row.id,
            title: row.title,
            published_date: row.published_date,
            source: row.source,
            main_text: row.main_text, // FULL TEXT for AI context
            threat_actor: row.threat_actor,
            victim: row.victim,
            incident_type: incident_type,
            vulnerabilities: vulnerabilities,
            tags: tags,
            url: row.url,
            similarity: parseFloat(row.similarity).toFixed(3)
          };
        });

      console.log(`🤖 Found ${similarArticles.length} similar articles for chat query: "${queryText}"`);
      return similarArticles;

    } catch (error) {
      console.error('Error in chat vector similarity search:', error);
      return [];
    }
  }

  // Get article by embedding similarity to another article
  async findSimilarToArticle(articleId: number, limit: number = 5): Promise<any[]> {
    try {
      const client = await this.pool.connect();
      
      const searchQuery = `
        WITH target_article AS (
          SELECT vector FROM public.articles WHERE id = $1 AND vector IS NOT NULL
        )
        SELECT 
          a.id, a.title, a.published_date, a.source, a.main_text, a.threat_actor, a.victim,
          a.incident_type, a.vulnerabilities, a.tags,
          (a.vector <=> t.vector) as distance,
          (1 - (a.vector <=> t.vector)) as similarity
        FROM public.articles a, target_article t
        WHERE a.vector IS NOT NULL 
        AND a.id != $1
        ORDER BY a.vector <=> t.vector
        LIMIT $2;
      `;

      const result = await client.query(searchQuery, [articleId, limit]);
      client.release();

      const similarArticles = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        published_date: row.published_date,
        source: row.source,
        main_text: row.main_text.slice(0, 500) + '...', // Truncate for display
        threat_actor: row.threat_actor,
        victim: row.victim,
        incident_type: JSON.parse(row.incident_type || '[]'),
        vulnerabilities: JSON.parse(row.vulnerabilities || '[]'),
        tags: JSON.parse(row.tags || '[]'),
        similarity: parseFloat(row.similarity).toFixed(3)
      }));

      console.log(`🔍 Found ${similarArticles.length} articles similar to article ID: ${articleId}`);
      return similarArticles;

    } catch (error) {
      console.error('Error finding similar articles:', error);
      return [];
    }
  }

  // Dashboard methods
  async getDashboardData(filters: any = {}): Promise<any> {
    const client: PoolClient = await this.pool.connect();
    
    try {
      // Build WHERE clause from filters
      const whereConditions: string[] = [];
      const params: any[] = [];
      let paramCount = 0;

      if (filters.dateRange?.start && filters.dateRange?.end) {
        paramCount++;
        whereConditions.push(`published_date BETWEEN $${paramCount} AND $${paramCount + 1}`);
        params.push(filters.dateRange.start, filters.dateRange.end);
        paramCount++;
      }

      if (filters.search) {
        paramCount++;
        whereConditions.push(`(title ILIKE $${paramCount} OR main_text ILIKE $${paramCount})`);
        params.push(`%${filters.search}%`);
      }

      if (filters.threatActor) {
        paramCount++;
        whereConditions.push(`threat_actor ILIKE $${paramCount}`);
        params.push(`%${filters.threatActor}%`);
      }

      if (filters.vendor) {
        paramCount++;
        whereConditions.push(`victim ILIKE $${paramCount}`);
        params.push(`%${filters.vendor}%`);
      }

      if (filters.cve) {
        paramCount++;
        whereConditions.push(`vulnerabilities::text ILIKE $${paramCount}`);
        params.push(`%${filters.cve}%`);
      }

      if (filters.source) {
        paramCount++;
        whereConditions.push(`source ILIKE $${paramCount}`);
        params.push(`%${filters.source}%`);
      }

      if (filters.incidentType) {
        paramCount++;
        whereConditions.push(`incident_type::text ILIKE $${paramCount}`);
        params.push(`%${filters.incidentType}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total articles count
      const totalCountResult = await client.query(`
        SELECT COUNT(*) as total FROM public.articles ${whereClause}
      `, params);

      // Get recent articles count (last 7 days)
      const recentCountResult = await client.query(`
        SELECT COUNT(*) as recent FROM public.articles 
        WHERE published_date >= CURRENT_DATE - INTERVAL '7 days' 
        ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
      `, params);

      // Get unique threat actors
      const threatActorsResult = await client.query(`
        SELECT DISTINCT threat_actor FROM public.articles 
        WHERE threat_actor IS NOT NULL AND threat_actor != '' 
        ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
        ORDER BY threat_actor
      `, params);

      // Get unique sources
      const sourcesResult = await client.query(`
        SELECT DISTINCT source FROM public.articles 
        WHERE source IS NOT NULL AND source != '' 
        ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
        ORDER BY source
      `, params);

      // Get vulnerabilities - fixed to handle JSON column properly
      let vulnerabilitiesResult: any = { rows: [] };
      try {
        vulnerabilitiesResult = await client.query(`
          SELECT vulnerabilities 
          FROM public.articles 
          WHERE vulnerabilities IS NOT NULL 
          AND json_array_length(vulnerabilities) > 0
          ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
        `, params);
      } catch (error) {
        console.log('Vulnerabilities query failed, using empty result');
      }

      // Get incident types from incident_type field  
      const incidentTypesResult = await client.query(`
        SELECT DISTINCT json_array_elements_text(incident_type) as incident_type 
        FROM public.articles 
        WHERE incident_type IS NOT NULL AND json_array_length(incident_type) > 0
        ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
        ORDER BY incident_type
      `, params);

      // Get articles by date (last 30 days)
      const articlesByDateResult = await client.query(`
        SELECT DATE(scrape_timestamp) as date, COUNT(*) as count
        FROM public.articles 
        WHERE scrape_timestamp >= CURRENT_DATE - INTERVAL '30 days'
        ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
        GROUP BY DATE(scrape_timestamp)
        ORDER BY date DESC
        LIMIT 30
      `, params);

      // Get top threat actors
      const topThreatActorsResult = await client.query(`
        SELECT threat_actor as name, COUNT(*) as count
        FROM public.articles 
        WHERE threat_actor IS NOT NULL AND threat_actor != ''
        ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
        GROUP BY threat_actor
        ORDER BY count DESC
        LIMIT 10
      `, params);

      // Get top incident types with counts
      const topIncidentTypesResult = await client.query(`
        SELECT json_array_elements_text(incident_type) as incident_type, COUNT(*) as count
        FROM public.articles 
        WHERE incident_type IS NOT NULL AND json_array_length(incident_type) > 0
        ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
        GROUP BY json_array_elements_text(incident_type)
        ORDER BY count DESC
        LIMIT 10
      `, params);

      // Get victim countries with counts
      const victimCountriesResult = await client.query(`
        SELECT victim_country as country, COUNT(*) as count
        FROM public.articles 
        WHERE victim_country IS NOT NULL AND victim_country != '' AND victim_country != 'Unknown'
        ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
        GROUP BY victim_country
        ORDER BY count DESC
        LIMIT 50
      `, params);

      // Get recent articles
      const recentArticlesResult = await client.query(`
        SELECT id, title, published_date, source, threat_actor, vulnerabilities, tags, impact, url, main_text
        FROM public.articles 
        ${whereClause}
        ORDER BY published_date DESC, scrape_timestamp DESC
        LIMIT 20
      `, params);

      // Parse and clean data
      const dashboardData = {
        totalArticles: parseInt(totalCountResult.rows[0]?.total || '0'),
        recentArticlesCount: parseInt(recentCountResult.rows[0]?.recent || '0'),
        threatActors: threatActorsResult.rows.map(row => row.threat_actor).filter(Boolean),
        sources: sourcesResult.rows.map(row => row.source).filter(Boolean),
        vulnerabilities: vulnerabilitiesResult.rows.flatMap((row: any) => {
          try {
            if (Array.isArray(row.vulnerabilities)) {
              return row.vulnerabilities;
            } else if (typeof row.vulnerabilities === 'string') {
              const vulns = JSON.parse(row.vulnerabilities);
              return Array.isArray(vulns) ? vulns : [];
            }
            return [];
          } catch {
            return [];
          }
        }).filter(Boolean),
        incidentTypes: incidentTypesResult.rows.map(row => row.incident_type).filter(Boolean),
        vendors: [], // Will extract from victim and vendor_mentioned fields
        articlesByDate: articlesByDateResult.rows.map(row => ({
          date: row.date,
          count: parseInt(row.count)
        })),
        topThreatActors: topThreatActorsResult.rows.map(row => ({
          name: row.name,
          count: parseInt(row.count)
        })),
        topIncidentTypes: topIncidentTypesResult.rows.map(row => ({
          name: row.incident_type,
          count: parseInt(row.count)
        })),
        topVendors: [], // Will implement later
        victimCountries: victimCountriesResult.rows.map(row => ({
          country: row.country,
          count: parseInt(row.count)
        })),
        recentArticles: recentArticlesResult.rows.map(row => {
          let vulnerabilities = [];
          let tags = [];
          let impact = 'Unknown';
          
          // Safely parse vulnerabilities (now JSON array)
          try {
            if (Array.isArray(row.vulnerabilities)) {
              vulnerabilities = row.vulnerabilities;
            } else if (typeof row.vulnerabilities === 'string') {
              vulnerabilities = JSON.parse(row.vulnerabilities);
            }
          } catch (error) {
            console.warn('Failed to parse vulnerabilities for article:', row.id);
          }
          
          // Safely parse tags (now JSON array)
          try {
            if (Array.isArray(row.tags)) {
              tags = row.tags;
            } else if (typeof row.tags === 'string') {
              tags = JSON.parse(row.tags);
            }
          } catch (error) {
            console.warn('Failed to parse tags for article:', row.id);
          }
          
          // Safely parse impact (now JSON array)
          try {
            if (Array.isArray(row.impact)) {
              impact = row.impact[0] || 'Unknown';
            } else if (typeof row.impact === 'string') {
              const impactArray = JSON.parse(row.impact);
              impact = Array.isArray(impactArray) ? impactArray[0] || 'Unknown' : row.impact;
            } else {
              impact = row.impact || 'Unknown';
            }
          } catch (error) {
            console.warn('Failed to parse impact for article:', row.id);
            impact = 'Unknown';
          }
          
          return {
            id: row.id,
            title: row.title,
            published_date: row.published_date,
            source: row.source,
            threat_actor: row.threat_actor || 'Unknown',
            vulnerabilities: Array.isArray(vulnerabilities) ? vulnerabilities : [],
            tags: Array.isArray(tags) ? tags : [],
            impact: impact,
            url: row.url,
            main_text: row.main_text
          };
        })
      };

      return dashboardData;

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getFilterOptions(): Promise<any> {
    const client: PoolClient = await this.pool.connect();
    
    try {
      // Get all unique threat actors
      const threatActorsResult = await client.query(`
        SELECT DISTINCT threat_actor FROM public.articles 
        WHERE threat_actor IS NOT NULL AND threat_actor != '' 
        ORDER BY threat_actor
      `);

      // Get all unique sources
      const sourcesResult = await client.query(`
        SELECT DISTINCT source FROM public.articles 
        WHERE source IS NOT NULL AND source != '' 
        ORDER BY source
      `);

      // Get all unique victims/vendors
      const vendorsResult = await client.query(`
        SELECT DISTINCT victim FROM public.articles 
        WHERE victim IS NOT NULL AND victim != '' 
        ORDER BY victim
      `);

      // Get all vulnerabilities - fixed for JSON column
      let vulnerabilitiesResult: any = { rows: [] };
      try {
        vulnerabilitiesResult = await client.query(`
          SELECT DISTINCT vulnerabilities 
          FROM public.articles 
          WHERE vulnerabilities IS NOT NULL AND json_array_length(vulnerabilities) > 0
        `);
      } catch (error) {
        console.log('Vulnerabilities query failed in filter options');
      }

      // Get all incident types from incident_type field
      const incidentTypesResult = await client.query(`
        SELECT DISTINCT json_array_elements_text(incident_type) as incident_type 
        FROM public.articles 
        WHERE incident_type IS NOT NULL AND json_array_length(incident_type) > 0
        ORDER BY incident_type
      `);

      return {
        threatActors: threatActorsResult.rows.map(row => row.threat_actor),
        sources: sourcesResult.rows.map(row => row.source),
        vendors: vendorsResult.rows.map(row => row.victim),
        vulnerabilities: vulnerabilitiesResult.rows.flatMap((row: any) => {
          try {
            if (Array.isArray(row.vulnerabilities)) {
              return row.vulnerabilities;
            } else if (typeof row.vulnerabilities === 'string') {
              const vulns = JSON.parse(row.vulnerabilities);
              return Array.isArray(vulns) ? vulns : [];
            }
            return [];
          } catch {
            return [];
          }
        }).filter(Boolean),
        incidentTypes: incidentTypesResult.rows.map(row => row.incident_type)
      };

    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

// Singleton instance
let dbService: DatabaseService | null = null;

export function getDatabaseService(): DatabaseService {
  if (!dbService) {
    dbService = new DatabaseService();
  }
  return dbService;
}

export async function testDatabaseConnection(): Promise<boolean> {
  const db = getDatabaseService();
  return await db.testConnection();
} 