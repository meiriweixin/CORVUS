import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Search, Filter, Download, RefreshCw, TrendingUp, Shield, AlertTriangle, Database, Activity, Eye, BarChart3, Globe, ChevronDown, ChevronUp, ExternalLink, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WorldMap } from './WorldMap';

interface DashboardData {
  totalArticles: number;
  recentArticlesCount: number;
  threatActors: string[];
  vendors: string[];
  vulnerabilities: string[];
  incidentTypes: string[];
  sources: string[];
  articlesByDate: Array<{ date: string; count: number }>;
  topThreatActors: Array<{ name: string; count: number }>;
  topIncidentTypes: Array<{ name: string; count: number }>;
  topVendors: Array<{ name: string; count: number }>;
  victimCountries: Array<{ country: string; count: number }>;
  recentArticles: Array<{
    id: number;
    title: string;
    published_date: string;
    source: string;
    threat_actor: string;
    vulnerabilities: string[];
    tags: string[];
    impact: string;
    url?: string;
    main_text?: string;
  }>;
}

interface DashboardFilters {
  dateRange: {
    start: string;
    end: string;
  };
  search: string;
  threatActor: string;
  vendor: string;
  cve: string;
  incidentType: string;
  source: string;
}

// Modal component for displaying full article text
const ArticleTextModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white truncate mr-4">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
            {content || 'No content available'}
          </div>
        </div>
      </div>
    </div>
  );
};

// Expandable tags component
const ExpandableTags: React.FC<{ tags: string[] }> = ({ tags }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedTags = isExpanded ? tags : tags.slice(0, 2);

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {displayedTags.map((tag, tagIndex) => (
        <span key={tagIndex} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
          {tag}
        </span>
      ))}
      {tags.length > 2 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              +{tags.length - 2} more
            </>
          )}
        </button>
      )}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    totalArticles: 0,
    recentArticlesCount: 0,
    threatActors: [],
    vendors: [],
    vulnerabilities: [],
    incidentTypes: [],
    sources: [],
    articlesByDate: [],
    topThreatActors: [],
    topIncidentTypes: [],
    topVendors: [],
    victimCountries: [],
    recentArticles: []
  });
  
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      start: '2025-01-01', // Start from January 1st, 2025
      end: new Date().toISOString().split('T')[0]
    },
    search: '',
    threatActor: '',
    vendor: '',
    cve: '',
    incidentType: '',
    source: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
  }>({
    isOpen: false,
    title: '',
    content: ''
  });

  // Tooltip state for chart
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: ''
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3001/api/dashboard-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Apply filters
  const handleApplyFilters = () => {
    fetchDashboardData();
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      search: '',
      threatActor: '',
      vendor: '',
      cve: '',
      incidentType: '',
      source: ''
    });
  };

  // Export data
  const handleExport = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-export-${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Open article text modal
  const openTextModal = (title: string, content: string) => {
    setModalState({
      isOpen: true,
      title,
      content
    });
  };

  // Calculate high impact articles count
  const highImpactCount = data.recentArticles.filter(article => 
    article.impact && article.impact.toLowerCase() === 'high'
  ).length;

  // Statistics cards
  const stats = [
    {
      title: 'Total Articles',
      value: data.totalArticles.toLocaleString(),
      icon: <Database className="h-6 w-6" />,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Recent Articles',
      value: data.recentArticlesCount.toLocaleString(),
      icon: <Activity className="h-6 w-6" />,
      color: 'green',
      change: '+8%'
    },
    {
      title: 'Threat Actors',
      value: data.topThreatActors.length.toLocaleString(),
      icon: <Shield className="h-6 w-6" />,
      color: 'red',
      change: '+5%'
    },
    {
      title: 'High Impact',
      value: highImpactCount.toLocaleString(),
      icon: <AlertTriangle className="h-6 w-6" />,
      color: 'orange',
      change: '+15%'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-300',
      green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-300',
      red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-300',
      orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30 text-orange-300'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-300 mb-2">Dashboard Error</h3>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Cyber Intelligence Dashboard</h1>
          <p className="text-gray-300">Real-time cybersecurity threat intelligence and analytics</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="flex-1 bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              />
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="flex-1 bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg pl-10 pr-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          {/* Threat Actor */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Threat Actor</label>
            <select
              value={filters.threatActor}
              onChange={(e) => setFilters(prev => ({ ...prev, threatActor: e.target.value }))}
              className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Threat Actors</option>
              {data.threatActors.map(actor => (
                <option key={actor} value={actor}>{actor}</option>
              ))}
            </select>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Source</label>
            <select
              value={filters.source}
              onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
              className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Sources</option>
              {data.sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Vendor/Victim */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Vendor/Victim</label>
            <input
              type="text"
              placeholder="Enter vendor or victim..."
              value={filters.vendor}
              onChange={(e) => setFilters(prev => ({ ...prev, vendor: e.target.value }))}
              className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          {/* CVE */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">CVE</label>
            <input
              type="text"
              placeholder="CVE-YYYY-NNNN"
              value={filters.cve}
              onChange={(e) => setFilters(prev => ({ ...prev, cve: e.target.value }))}
              className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          {/* Incident Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Incident Type</label>
            <select
              value={filters.incidentType}
              onChange={(e) => setFilters(prev => ({ ...prev, incidentType: e.target.value }))}
              className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Types</option>
              {data.incidentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleApplyFilters}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Apply Filters
          </button>
          <button
            onClick={handleClearFilters}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`bg-gradient-to-br ${getColorClasses(stat.color)} border rounded-xl p-6 backdrop-blur-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-${stat.color}-500/20`}>
                {stat.icon}
              </div>
              <span className="text-xs font-medium text-green-400">{stat.change}</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-sm opacity-80">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      {/* Row 1: Articles Over Time + Top Threat Actors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Articles Over Time */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 h-80">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Articles Over Time
          </h3>
          <div className="h-64 relative">
          {data.articlesByDate.length > 0 ? (
            <svg className="w-full h-full" viewBox="0 0 400 200">
              {/* Grid lines */}
              {Array.from({ length: 5 }, (_, i) => (
                <line
                  key={`grid-${i}`}
                  x1="40"
                  y1={20 + (i * 40)}
                  x2="380"
                  y2={20 + (i * 40)}
                  stroke="#374151"
                  strokeWidth="0.5"
                  opacity="0.5"
                />
              ))}
              
              {/* Y-axis labels */}
              {(() => {
                const maxCount = Math.max(...data.articlesByDate.map(d => d.count), 1);
                return Array.from({ length: 5 }, (_, i) => {
                  const value = Math.round(maxCount - (i * maxCount / 4));
                  return (
                    <text
                      key={`y-label-${i}`}
                      x="35"
                      y={25 + (i * 40)}
                      fill="#9CA3AF"
                      fontSize="10"
                      textAnchor="end"
                    >
                      {value}
                    </text>
                  );
                });
              })()}
              
              {/* Line chart */}
              {(() => {
                const maxCount = Math.max(...data.articlesByDate.map(d => d.count), 1);
                const sortedData = [...data.articlesByDate].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);
                const points = sortedData.map((item, index) => {
                  const x = 50 + (index * (320 / Math.max(sortedData.length - 1, 1)));
                  const y = 180 - ((item.count / maxCount) * 140);
                  return { x, y, count: item.count, date: item.date };
                });
                
                // Line path
                const pathData = points.map((point, index) => 
                  `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                ).join(' ');
                
                return (
                  <>
                    {/* Line */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Area under line */}
                    <path
                      d={`${pathData} L ${points[points.length - 1]?.x || 0} 180 L ${points[0]?.x || 0} 180 Z`}
                      fill="url(#areaGradient)"
                      opacity="0.3"
                    />
                    
                    {/* Data points with hover functionality */}
                    {points.map((point, index) => (
                      <g key={index}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="6"
                          fill="#0EA5E9"
                          stroke="#ffffff"
                          strokeWidth="2"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={(e) => {
                            const rect = (e.currentTarget.closest('svg') as SVGElement)?.getBoundingClientRect();
                            if (rect) {
                              setTooltip({
                                visible: true,
                                x: rect.left + point.x * (rect.width / 400),
                                y: rect.top + point.y * (rect.height / 200),
                                content: `${new Date(point.date).toLocaleDateString()}: ${point.count} articles`
                              });
                            }
                          }}
                          onMouseLeave={() => setTooltip(prev => ({ ...prev, visible: false }))}
                        />
                      </g>
                    ))}
                    
                    {/* X-axis labels */}
                    {points.map((point, index) => (
                      <text
                        key={`x-label-${index}`}
                        x={point.x}
                        y="195"
                        fill="#9CA3AF"
                        fontSize="9"
                        textAnchor="middle"
                      >
                        {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </text>
                    ))}
                  </>
                );
              })()}
              
              {/* Gradients */}
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#0EA5E9" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0EA5E9" />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No data available
            </div>
          )}
          </div>
        </div>

        {/* Top Threat Actors */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 h-80">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Top Threat Actors
          </h3>
          <div className="space-y-3 overflow-y-auto h-56">
            {data.topThreatActors.slice(0, 5).map((actor, index) => {
              const maxCount = data.topThreatActors[0]?.count || 1;
              const width = (actor.count / maxCount) * 100;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300 truncate">{actor.name || 'Unknown'}</span>
                    <span className="text-gray-400">{actor.count}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Top Incident Types + Impact Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Incident Types */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 h-80">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Incident Types
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topIncidentTypes.map(item => ({
              name: item.name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
              value: item.count
            })).slice(0, 6)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: '#9CA3AF' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Bar dataKey="value" fill="#0894FF" />
            </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Impact Distribution */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 h-80">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Impact Distribution
          </h3>
          <div className="flex flex-col justify-evenly h-56">
            {(() => {
              const impactLevels = ['High', 'Medium', 'Low'];
              const impactCounts = impactLevels.map(level => ({
                level,
                count: data.recentArticles.filter(a => a.impact && a.impact.toLowerCase() === level.toLowerCase()).length
              }));
              const maxCount = Math.max(...impactCounts.map(i => i.count), 1);
              const colors = { 'High': '#EF4444', 'Medium': '#F59E0B', 'Low': '#10B981' };
              
              return impactCounts.map(({ level, count }) => {
                const width = (count / maxCount) * 100;
                return (
                  <div key={level} className="flex items-center justify-between py-2">
                    <span className="text-gray-300 text-sm truncate flex-1">{level} Impact</span>
                    <div className="flex items-center gap-2 flex-1">
                      <div 
                        className="h-4 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.max(width, 5)}%`,
                          backgroundColor: colors[level as keyof typeof colors]
                        }}
                      />
                      <span className="text-white font-medium text-sm min-w-[20px]">{count}</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* World Map */}
      {data.victimCountries && data.victimCountries.length > 0 && (
        <WorldMap victimCountries={data.victimCountries} />
      )}

      {/* Recent Articles */}
      <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Recent Articles
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-300 font-medium py-3 px-4">Title</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Article Date</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Source</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Threat Actor</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Tags</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Main Text</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading articles...
                  </td>
                </tr>
              ) : data.recentArticles.length > 0 ? (
                data.recentArticles.slice(0, 10).map((article, index) => (
                  <tr key={article.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="max-w-xs">
                        {/* Always make title clickable if we have any URL-like content, otherwise show as clickable placeholder */}
                        <a
                          href={article.url || '#'}
                          target={article.url ? "_blank" : "_self"}
                          rel={article.url ? "noopener noreferrer" : undefined}
                          onClick={!article.url ? (e) => {
                            e.preventDefault();
                            alert('URL not available for this article');
                          } : undefined}
                          className="text-white font-medium hover:text-blue-400 transition-colors flex items-center gap-1 truncate cursor-pointer"
                          title={article.title}
                        >
                          {article.title}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {new Date(article.published_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {article.source}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {article.threat_actor || 'Unknown'}
                    </td>
                    <td className="py-3 px-4">
                      <ExpandableTags tags={article.tags} />
                    </td>
                    <td className="py-3 px-4">
                      {article.main_text && article.main_text.trim() ? (
                        <button
                          onClick={() => openTextModal(article.title, article.main_text || '')}
                          className="text-blue-400 hover:text-blue-300 text-sm bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded transition-colors max-w-xs truncate block"
                          title="Click to view full text"
                        >
                          {article.main_text.length > 50 
                            ? `${article.main_text.substring(0, 50)}...` 
                            : article.main_text
                          }
                        </button>
                      ) : (
                        <span className="text-gray-500 text-sm">No content available</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No articles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tooltip for chart */}
      {tooltip.visible && (
        <div
          className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 30,
          }}
        >
          {tooltip.content}
        </div>
      )}

      {/* Article Text Modal */}
      <ArticleTextModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        title={modalState.title}
        content={modalState.content}
      />
    </div>
  );
};