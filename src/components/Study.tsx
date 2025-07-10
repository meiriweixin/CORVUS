import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Search,
  RefreshCw,
  Download,
  Brain,
  FileText,
  Filter,
  ChevronRight,
  Loader2,
  CheckSquare,
  Square,
  BarChart3,
  Network
} from 'lucide-react';
import { 
  ReactFlow, 
  Node, 
  Edge, 
  Controls, 
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Position,
  MarkerType,
  Handle
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
// Removed markmap imports - using React Flow only

interface Article {
  id: number;
  title: string;
  source: string;
  threat_actor: string;
  victim: string;
  vulnerabilities: string[];
  tags: string[];
  published_date: string;
  url: string;
  main_text: string;
  incident_type: string[];
  impact: string[];
}

interface FilterOptions {
  sources: string[];
  incidentTypes: string[];
  threatActors: string[];
}

interface StudyAnalysis {
  keyPoints: {
    articleId: number;
    title: string;
    keyPoints: string[];
    summary: string;
    timeline: string;
    impact: string;
    threatActors?: string[];
    victims?: string[];
    attackVectors?: string[];
    indicators?: string[];
  }[];
  relationships: {
    commonThemes: string[];
    connectionPoints: string[];
    sharedActors?: string[];
    sharedVictims?: string[];
    timeline: Array<{
      date: string;
      event: string;
      articleId: number;
    }>;
  };
}

// Enhanced Custom Node Components with click-to-expand functionality
const CustomNodeComponent = ({ data, selected, type }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getNodeConfig = (nodeType: string) => {
    switch (nodeType) {
      case 'article':
        return {
          gradient: 'from-blue-800 to-blue-900',
          border: selected ? 'border-blue-400' : 'border-blue-600',
          ring: 'ring-blue-400',
          icon: '📄',
          iconBg: 'bg-blue-500',
          handleColor: '!bg-blue-400',
          textColor: 'text-blue-200',
          minWidth: 'min-w-[200px]',
          maxWidth: 'max-w-[280px]'
        };
      case 'actor':
        return {
          gradient: 'from-red-800 to-red-900',
          border: selected ? 'border-red-400' : 'border-red-600',
          ring: 'ring-red-400',
          icon: '🎯',
          iconBg: 'bg-red-500',
          handleColor: '!bg-red-400',
          textColor: 'text-red-200',
          subtitle: 'Threat Actor',
          minWidth: 'min-w-[160px]',
          maxWidth: 'max-w-[240px]'
        };
      case 'victim':
        return {
          gradient: 'from-orange-800 to-orange-900',
          border: selected ? 'border-orange-400' : 'border-orange-600',
          ring: 'ring-orange-400',
          icon: '🏢',
          iconBg: 'bg-orange-500',
          handleColor: '!bg-orange-400',
          textColor: 'text-orange-200',
          subtitle: 'Target/Victim',
          minWidth: 'min-w-[160px]',
          maxWidth: 'max-w-[240px]'
        };
      case 'event':
        return {
          gradient: 'from-green-800 to-green-900',
          border: selected ? 'border-green-400' : 'border-green-600',
          ring: 'ring-green-400',
          icon: '⚡',
          iconBg: 'bg-green-500',
          handleColor: '!bg-green-400',
          textColor: 'text-green-200',
          subtitle: 'Event/Method',
          minWidth: 'min-w-[180px]',
          maxWidth: 'max-w-[260px]'
        };
      case 'theme':
        return {
          gradient: 'from-purple-800 to-purple-900',
          border: selected ? 'border-purple-400' : 'border-purple-600',
          ring: 'ring-purple-400',
          icon: '🔗',
          iconBg: 'bg-purple-500',
          handleColor: '!bg-purple-400',
          textColor: 'text-purple-200',
          subtitle: 'Theme/Connection',
          minWidth: 'min-w-[220px]',
          maxWidth: 'max-w-[300px]'
        };
      default:
        return {
          gradient: 'from-gray-800 to-gray-900',
          border: 'border-gray-600',
          ring: 'ring-gray-400',
          icon: '◯',
          iconBg: 'bg-gray-500',
          handleColor: '!bg-gray-400',
          textColor: 'text-gray-200',
          minWidth: 'min-w-[160px]',
          maxWidth: 'max-w-[240px]'
        };
    }
  };

  const config = getNodeConfig(type);
  const fullText = data.fullText || data.label;
  const displayText = isExpanded ? fullText : (data.label?.length > 40 ? data.label.substring(0, 40) + '...' : data.label);
  const hasLongText = fullText && fullText.length > 40;

  return (
    <div 
      className={`relative p-4 rounded-xl border-2 bg-gradient-to-br ${config.gradient} text-white ${config.minWidth} ${config.maxWidth} ${
        selected ? `ring-2 ${config.ring} ring-opacity-60 ${config.border}` : config.border
      } shadow-lg transition-all duration-300 hover:scale-105 ${hasLongText ? 'cursor-pointer' : ''}`}
      onClick={() => hasLongText && setIsExpanded(!isExpanded)}
      title={hasLongText ? "Click to expand/collapse" : undefined}
    >
      <Handle type="target" position={Position.Top} className={`w-3 h-3 ${config.handleColor}`} />
      <Handle type="source" position={Position.Bottom} className={`w-3 h-3 ${config.handleColor}`} />
      
      <div className={`absolute -top-2 -right-2 w-6 h-6 ${config.iconBg} rounded-full flex items-center justify-center text-xs font-bold`}>
        {config.icon}
      </div>
      
      {hasLongText && (
        <div className="absolute -top-1 -left-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-black">
          {isExpanded ? '−' : '+'}
        </div>
      )}
      
      <div className="space-y-2">
        <div className={`font-bold text-sm leading-tight ${type === 'theme' ? 'text-center' : ''} ${isExpanded ? 'whitespace-normal' : ''}`}>
          {displayText}
        </div>
        {data.subtitle && (
          <div className={`text-xs ${config.textColor} ${type === 'theme' ? 'text-center' : ''}`}>
            {data.subtitle}
          </div>
        )}
        {config.subtitle && !data.subtitle && (
          <div className={`text-xs ${config.textColor} ${type === 'theme' ? 'text-center' : ''}`}>
            {config.subtitle}
          </div>
        )}
        {data.date && <div className="text-xs bg-black/20 rounded px-2 py-1">{data.date}</div>}
      </div>
    </div>
  );
};

const ArticleNode = (props: any) => <CustomNodeComponent {...props} type="article" />;
const ActorNode = (props: any) => <CustomNodeComponent {...props} type="actor" />;
const VictimNode = (props: any) => <CustomNodeComponent {...props} type="victim" />;
const EventNode = (props: any) => <CustomNodeComponent {...props} type="event" />;
const ThemeNode = (props: any) => <CustomNodeComponent {...props} type="theme" />;

const nodeTypes = {
  article: ArticleNode,
  actor: ActorNode,
  victim: VictimNode,
  event: EventNode,
  theme: ThemeNode,
};



export const Study = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    sources: [],
    incidentTypes: [],
    threatActors: []
  });
  const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<StudyAnalysis | null>(null);
  const [isArticleSelectionCollapsed, setIsArticleSelectionCollapsed] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    source: '',
    incidentType: '',
    threatActor: '',
    search: ''
  });
  
  // Layout states
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // percentage - equal width sections
  const [isDragging, setIsDragging] = useState(false);
  // Removed visualization type - using article-based tabs instead
  
  // React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  
  // Article selection for visualization
  const [selectedArticleIndex, setSelectedArticleIndex] = useState(0);

  // Load articles and filter options
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load filter options
      const filterResponse = await fetch('http://localhost:3001/api/filter-options');
      if (filterResponse.ok) {
        const filterData = await filterResponse.json();
        setFilterOptions(filterData);
      }

      // Load filtered articles
      const queryParams = new URLSearchParams();
      if (filters.source) queryParams.append('source', filters.source);
      if (filters.incidentType) queryParams.append('incidentType', filters.incidentType);
      if (filters.threatActor) queryParams.append('threatActor', filters.threatActor);
      if (filters.search) queryParams.append('search', filters.search);

      const articlesResponse = await fetch(`http://localhost:3001/api/articles?${queryParams}`);
      if (articlesResponse.ok) {
        const articlesData = await articlesResponse.json();
        setArticles(articlesData.articles || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle article selection
  const handleArticleSelect = (article: Article) => {
    setSelectedArticles(prev => {
      const isSelected = prev.some(a => a.id === article.id);
      if (isSelected) {
        return prev.filter(a => a.id !== article.id);
      } else if (prev.length < 3) {
        return [...prev, article];
      } else {
        // Replace the first selected article if already at max
        return [prev[1], prev[2], article];
      }
    });
  };

  // Generate analysis
  const handleGenerate = useCallback(async () => {
    if (selectedArticles.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('http://localhost:3001/api/study/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: selectedArticles.map(article => ({
            id: article.id,
            title: article.title,
            content: article.main_text,
            published_date: article.published_date,
            threat_actor: article.threat_actor,
            victim: article.victim,
            incident_type: article.incident_type,
            source: article.source
          }))
        })
      });

      if (response.ok) {
        const analysisData = await response.json();
        setAnalysis(analysisData);
        setIsArticleSelectionCollapsed(true); // Collapse article selection when results are generated
      } else {
        console.error('Analysis failed:', response.statusText);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedArticles]);

  // Transform analysis data to React Flow format for a specific article
  const transformToReactFlow = useCallback((analysisData: StudyAnalysis, articleIndex: number): { nodes: Node[], edges: Edge[] } => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Show detailed visualization for the selected article
    if (articleIndex >= 0 && articleIndex < analysisData.keyPoints.length) {
      const article = analysisData.keyPoints[articleIndex];
      const centerX = 400;
      const centerY = 300;

      // Central article node
      const articleNodeId = `article_${article.articleId}`;
      newNodes.push({
        id: articleNodeId,
        type: 'article',
        position: { x: centerX, y: centerY },
        data: {
          label: article.title.length > 50 ? article.title.substring(0, 50) + '...' : article.title,
          fullText: article.title,
          subtitle: article.timeline,
          date: article.timeline
        }
      });

      // Create multiple layers around the article for better visualization with improved spacing
      const innerRadius = 250;
      const outerRadius = 420;
      let innerAngle = 0;

      // Summary/Impact nodes (inner ring)
      if (article.summary) {
        const summaryNodeId = `summary_${article.articleId}`;
        const x = centerX + Math.cos(innerAngle) * innerRadius;
        const y = centerY + Math.sin(innerAngle) * innerRadius;
        
        newNodes.push({
          id: summaryNodeId,
          type: 'theme',
          position: { x, y },
          data: { 
            label: 'Summary & Impact', 
            subtitle: article.impact || 'Impact Assessment',
            fullText: `Summary & Impact: ${article.summary || 'No summary available'}. Impact: ${article.impact || 'Unknown impact'}`
          }
        });

        newEdges.push({
          id: `edge_${articleNodeId}_${summaryNodeId}`,
          source: articleNodeId,
          target: summaryNodeId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#8B5CF6', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#8B5CF6' }
        });

        innerAngle += Math.PI / 2;
      }

      // Timeline node
      if (article.timeline) {
        const timelineNodeId = `timeline_${article.articleId}`;
        const x = centerX + Math.cos(innerAngle) * innerRadius;
        const y = centerY + Math.sin(innerAngle) * innerRadius;
        
        newNodes.push({
          id: timelineNodeId,
          type: 'theme',
          position: { x, y },
          data: { 
            label: 'Timeline', 
            subtitle: article.timeline,
            fullText: `Timeline: ${article.timeline || 'No timeline available'}`
          }
        });

        newEdges.push({
          id: `edge_${articleNodeId}_${timelineNodeId}`,
          source: articleNodeId,
          target: timelineNodeId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#3B82F6', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#3B82F6' }
        });

        innerAngle += Math.PI / 2;
      }

      // Key Points node
      if (article.keyPoints && article.keyPoints.length > 0) {
        const keyPointsNodeId = `keypoints_${article.articleId}`;
        const x = centerX + Math.cos(innerAngle) * innerRadius;
        const y = centerY + Math.sin(innerAngle) * innerRadius;
        
        newNodes.push({
          id: keyPointsNodeId,
          type: 'theme',
          position: { x, y },
          data: { 
            label: 'Key Points', 
            subtitle: `${article.keyPoints.length} findings`,
            fullText: `Key Points (${article.keyPoints.length} findings): ${article.keyPoints.slice(0, 3).join(', ')}${article.keyPoints.length > 3 ? '...' : ''}`
          }
        });

        newEdges.push({
          id: `edge_${articleNodeId}_${keyPointsNodeId}`,
          source: articleNodeId,
          target: keyPointsNodeId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#10B981', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10B981' }
        });

        // Add individual key points as smaller nodes with better spacing
        article.keyPoints.slice(0, 3).forEach((point, idx) => {
          const pointNodeId = `point_${article.articleId}_${idx}`;
          const pointAngle = innerAngle + (idx - 1) * (Math.PI / 4); // Increased spacing
          const x = centerX + Math.cos(pointAngle) * (innerRadius + 80); // Increased distance
          const y = centerY + Math.sin(pointAngle) * (innerRadius + 80);
          
          newNodes.push({
            id: pointNodeId,
            type: 'event',
            position: { x, y },
            data: { 
              label: point.length > 25 ? point.substring(0, 25) + '...' : point,
              fullText: point
            }
          });

          newEdges.push({
            id: `edge_${keyPointsNodeId}_${pointNodeId}`,
            source: keyPointsNodeId,
            target: pointNodeId,
            type: 'straight',
            style: { stroke: '#10B981', strokeWidth: 1, opacity: 0.7 }
          });
        });

        innerAngle += Math.PI / 2;
      }

      // Outer ring for threat actors, victims, and attack vectors
      const outerCategories = [];
      if (article.threatActors && article.threatActors.length > 0) {
        outerCategories.push({ type: 'actor', items: article.threatActors, color: '#EF4444' });
      }
      if (article.victims && article.victims.length > 0) {
        outerCategories.push({ type: 'victim', items: article.victims, color: '#F59E0B' });
      }
      if (article.attackVectors && article.attackVectors.length > 0) {
        outerCategories.push({ type: 'event', items: article.attackVectors, color: '#DC2626' });
      }

      // Improved outer ring distribution with better spacing
      let totalOuterNodes = outerCategories.reduce((sum, cat) => sum + cat.items.length, 0);
      let currentNodeIndex = 0;
      
      outerCategories.forEach((category, categoryIdx) => {
        category.items.forEach((item, itemIdx) => {
          // Distribute nodes evenly around the circle with minimum spacing
          const baseAngle = (currentNodeIndex / totalOuterNodes) * 2 * Math.PI;
          const minSpacing = Math.PI / 6; // Minimum spacing between nodes
          const angle = baseAngle + (currentNodeIndex * minSpacing / totalOuterNodes);
          
          const nodeId = `${category.type}_${article.articleId}_${itemIdx}`;
          const x = centerX + Math.cos(angle) * outerRadius;
          const y = centerY + Math.sin(angle) * outerRadius;
          
          newNodes.push({
            id: nodeId,
            type: category.type,
            position: { x, y },
            data: { 
              label: item.length > 20 ? item.substring(0, 20) + '...' : item,
              fullText: item
            }
          });

          newEdges.push({
            id: `edge_${articleNodeId}_${nodeId}`,
            source: articleNodeId,
            target: nodeId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: category.color, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: category.color }
          });
          
          currentNodeIndex++;
        });
      });

      // Add some additional context nodes if we have indicators
      if (article.indicators && article.indicators.length > 0) {
        const indicatorsNodeId = `indicators_${article.articleId}`;
        const x = centerX;
        const y = centerY - innerRadius;
        
        newNodes.push({
          id: indicatorsNodeId,
          type: 'theme',
          position: { x, y },
          data: { 
            label: 'Technical Indicators', 
            subtitle: `${article.indicators.length} IOCs`,
            fullText: `Technical Indicators (${article.indicators.length} IOCs): ${article.indicators.slice(0, 3).join(', ')}${article.indicators.length > 3 ? '...' : ''}`
          }
        });

        newEdges.push({
          id: `edge_${articleNodeId}_${indicatorsNodeId}`,
          source: articleNodeId,
          target: indicatorsNodeId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6B7280', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6B7280' }
        });
      }
    }

    return { nodes: newNodes, edges: newEdges };
  }, []);

  // Update React Flow when analysis or selected article changes
  useEffect(() => {
    if (analysis && analysis.keyPoints.length > 0) {
      const { nodes: newNodes, edges: newEdges } = transformToReactFlow(analysis, selectedArticleIndex);
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [analysis, selectedArticleIndex, transformToReactFlow, setNodes, setEdges]);

  // Handle panel resize
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const containerWidth = window.innerWidth;
    const newWidth = (e.clientX / containerWidth) * 100;
    setLeftPanelWidth(Math.max(20, Math.min(80, newWidth)));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      if (filters.search && !article.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [articles, filters.search]);

  return (
    <>
      <style>
        {`
          .react-flow-controls-dark {
            background: rgba(31, 41, 55, 0.9) !important;
            border: 1px solid rgba(75, 85, 99, 0.6) !important;
            border-radius: 8px !important;
          }
          
          .react-flow-controls-dark button {
            background: rgba(55, 65, 81, 0.8) !important;
            border: 1px solid rgba(75, 85, 99, 0.6) !important;
            color: white !important;
            border-radius: 4px !important;
            margin: 2px !important;
          }
          
          .react-flow-controls-dark button:hover {
            background: rgba(75, 85, 99, 0.9) !important;
            transform: scale(1.05);
          }
          
          .react-flow-controls-dark button svg {
            fill: white !important;
            color: white !important;
          }
          
          .react-flow-controls-dark button:disabled {
            opacity: 0.5 !important;
            cursor: not-allowed !important;
          }
        `}
      </style>
      <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              Intelligence Study Center
            </h1>
            <p className="text-gray-300 text-lg">
              Analyze and compare cybersecurity intelligence articles with AI-powered insights
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold">Article Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Source</label>
              <select
                value={filters.source}
                onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sources</option>
                {filterOptions.sources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Incident Type</label>
              <select
                value={filters.incidentType}
                onChange={(e) => setFilters(prev => ({ ...prev, incidentType: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {filterOptions.incidentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Threat Actor</label>
              <select
                value={filters.threatActor}
                onChange={(e) => setFilters(prev => ({ ...prev, threatActor: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actors</option>
                {filterOptions.threatActors.map(actor => (
                  <option key={actor} value={actor}>{actor}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Article Selection */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsArticleSelectionCollapsed(!isArticleSelectionCollapsed)}
                className="flex items-center gap-2 hover:bg-gray-700/50 rounded-lg p-1 transition-colors"
              >
                <FileText className="h-5 w-5 text-green-400" />
                <h3 className="text-lg font-semibold">Select Articles (1-3)</h3>
                <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isArticleSelectionCollapsed ? 'rotate-0' : 'rotate-90'}`} />
              </button>
              <span className="text-sm text-gray-400">
                {selectedArticles.length}/3 selected
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {analysis && (
                <button
                  onClick={() => setIsArticleSelectionCollapsed(!isArticleSelectionCollapsed)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-sm"
                >
                  {isArticleSelectionCollapsed ? 'Show Selection' : 'Hide Selection'}
                </button>
              )}
              <button
                onClick={handleGenerate}
                disabled={selectedArticles.length === 0 || isAnalyzing}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'Generate Study'}
              </button>
            </div>
          </div>

          {!isArticleSelectionCollapsed && (
            <div className="max-h-96 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                <span className="ml-2">Loading articles...</span>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No articles found matching the current filters
              </div>
            ) : (
              filteredArticles.map(article => {
                const isSelected = selectedArticles.some(a => a.id === article.id);
                return (
                  <div
                    key={article.id}
                    onClick={() => handleArticleSelect(article)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'bg-purple-900/50 border-purple-400 ring-1 ring-purple-400' 
                        : 'bg-gray-800/50 border-gray-600 hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-purple-400" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white mb-2 line-clamp-2">
                          {article.title}
                        </h4>
                        
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded">
                            {article.source}
                          </span>
                          <span className="px-2 py-1 bg-red-600/20 text-red-300 rounded">
                            {article.threat_actor || 'Unknown'}
                          </span>
                          <span className="px-2 py-1 bg-green-600/20 text-green-300 rounded">
                            {article.published_date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          )}
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="flex h-[800px] bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
            {/* Left Panel - Key Points */}
            <div 
              className="bg-gray-800/50 overflow-y-auto"
              style={{ width: `${leftPanelWidth}%` }}
            >
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                  <h3 className="text-xl font-bold">Key Insights</h3>
                </div>

                <div className="space-y-6">
                  {analysis.keyPoints.map((point, index) => (
                    <div key={point.articleId} className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        {point.title}
                      </h4>
                      
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-green-400">Summary: </span>
                          <span className="text-gray-300">{point.summary}</span>
                        </div>
                        
                        <div>
                          <span className="font-medium text-blue-400">Timeline: </span>
                          <span className="text-gray-300">{point.timeline}</span>
                        </div>
                        
                        <div>
                          <span className="font-medium text-red-400">Impact: </span>
                          <span className="text-gray-300">{point.impact}</span>
                        </div>
                        
                        <div>
                          <span className="font-medium text-yellow-400">Key Points:</span>
                          <ul className="mt-2 space-y-1">
                            {point.keyPoints.map((kp, idx) => (
                              <li key={idx} className="text-gray-300 flex items-start gap-2">
                                <ChevronRight className="h-3 w-3 mt-1 text-yellow-400 flex-shrink-0" />
                                {kp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Common Themes */}
                  {analysis.relationships.commonThemes.length > 0 && (
                    <div className="bg-purple-900/30 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-300 mb-3">Common Themes</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.relationships.commonThemes.map((theme, idx) => (
                          <span key={idx} className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-full text-xs">
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resize Handle */}
            <div
              className="w-1 bg-gray-600 hover:bg-gray-500 cursor-col-resize transition-colors"
              onMouseDown={handleMouseDown}
            />

            {/* Right Panel - Visualization */}
            <div 
              className="bg-gray-800/30 overflow-hidden"
              style={{ width: `${100 - leftPanelWidth}%` }}
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-600">
                  <div className="flex items-center gap-2">
                    <Network className="h-6 w-6 text-green-400" />
                    <h3 className="text-xl font-bold">Visualization</h3>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col">
                  {/* Article Tabs */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Article Analysis:</span>
                    </div>
                    <div className="flex bg-gray-700 rounded-lg p-1 gap-1">
                      {analysis.keyPoints.map((article, index) => (
                        <button
                          key={article.articleId}
                          onClick={() => setSelectedArticleIndex(index)}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            selectedArticleIndex === index
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          Article {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visualization Content */}
                  <div className="flex-1 relative">
                    {analysis ? (
                      <ReactFlowProvider>
                        <ReactFlow
                          nodes={nodes}
                          edges={edges}
                          onNodesChange={onNodesChange}
                          onEdgesChange={onEdgesChange}
                          nodeTypes={nodeTypes}
                          fitView
                          fitViewOptions={{ padding: 20, minZoom: 0.5, maxZoom: 2 }}
                          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                          className="bg-gray-900"
                          attributionPosition="bottom-left"
                        >
                          <Background 
                            color="#374151" 
                            gap={20} 
                            size={1}
                          />
                          <Controls 
                            className="react-flow-controls-dark"
                            showInteractive={true}
                            showFitView={true}
                            showZoom={true}
                          />
                        </ReactFlow>
                      </ReactFlowProvider>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                          <Network className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p>Select articles and generate analysis to view relationships</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}; 