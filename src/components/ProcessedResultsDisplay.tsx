import React, { useState, useMemo, useCallback } from 'react';
import {
  SearchIcon,
  FilterIcon,
  ExternalLinkIcon,
  DownloadIcon,
  AlertTriangleIcon,
  ShieldIcon,
  ZapIcon,
  BrainIcon,
  CalendarIcon,
  StarIcon,
  SortAscIcon,
  SortDescIcon,
  ChevronDownIcon,
  CheckIcon,
  EyeIcon,
  CopyIcon,
  TagIcon,
  UserIcon,
  BuildingIcon
} from 'lucide-react';
import { ProcessedArticle, CyberEventType } from '../types/crawling';

interface ProcessedResultsDisplayProps {
  processedData: ProcessedArticle[];
  isLoading?: boolean;
  onExport?: (data: ProcessedArticle[]) => void;
}

type SortField = 'articleTitle' | 'riskScore' | 'confidenceScore' | 'articleDate' | 'eventType';
type SortDirection = 'asc' | 'desc';

export const ProcessedResultsDisplay: React.FC<ProcessedResultsDisplayProps> = ({
  processedData,
  isLoading = false,
  onExport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventTypes, setSelectedEventTypes] = useState<CyberEventType[]>([]);
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('riskScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Get unique values from data
  const { availableEventTypes, availableRiskLevels } = useMemo(() => {
    const eventTypes = [...new Set(processedData.map(item => item.eventType))];
    const riskLevels = ['Low (0-3)', 'Medium (4-6)', 'High (7-8)', 'Critical (9-10)'];
    
    return {
      availableEventTypes: eventTypes.sort(),
      availableRiskLevels: riskLevels
    };
  }, [processedData]);

  const getRiskLevel = (score: number): string => {
    if (score <= 3) return 'Low (0-3)';
    if (score <= 6) return 'Medium (4-6)';
    if (score <= 8) return 'High (7-8)';
    return 'Critical (9-10)';
  };

  const getRiskColor = (score: number): string => {
    if (score <= 3) return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (score <= 6) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    if (score <= 8) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    return 'bg-red-500/20 text-red-300 border-red-500/30';
  };

  const getEventTypeColor = (eventType: CyberEventType): string => {
    switch (eventType) {
      case CyberEventType.CYBER_ATTACK:
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case CyberEventType.DATA_BREACH:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case CyberEventType.MALWARE_CAMPAIGN:
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case CyberEventType.VULNERABILITY_DISCLOSURE:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case CyberEventType.INCIDENT_RESPONSE:
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Filter and sort data
  const processedFilteredData = useMemo(() => {
    let filtered = processedData;

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.articleTitle.toLowerCase().includes(search) ||
        item.articleSummary.toLowerCase().includes(search) ||
        item.attacker.toLowerCase().includes(search) ||
        item.victim.toLowerCase().includes(search) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(search)) ||
        item.vulnerabilities.some(vuln => vuln.toLowerCase().includes(search))
      );
    }

    // Apply event type filter
    if (selectedEventTypes.length > 0) {
      filtered = filtered.filter(item => selectedEventTypes.includes(item.eventType));
    }

    // Apply risk level filter
    if (selectedRiskLevels.length > 0) {
      filtered = filtered.filter(item => {
        const itemRiskLevel = getRiskLevel(item.riskScore);
        return selectedRiskLevels.includes(itemRiskLevel);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (sortField) {
        case 'articleTitle':
          valueA = a.articleTitle.toLowerCase();
          valueB = b.articleTitle.toLowerCase();
          break;
        case 'riskScore':
          valueA = a.riskScore;
          valueB = b.riskScore;
          break;
        case 'confidenceScore':
          valueA = a.confidenceScore;
          valueB = b.confidenceScore;
          break;
        case 'articleDate':
          valueA = a.articleDate ? new Date(a.articleDate) : new Date(0);
          valueB = b.articleDate ? new Date(b.articleDate) : new Date(0);
          break;
        case 'eventType':
          valueA = a.eventType;
          valueB = b.eventType;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [processedData, searchTerm, selectedEventTypes, selectedRiskLevels, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedFilteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = processedFilteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  const toggleEventTypeFilter = useCallback((eventType: CyberEventType) => {
    setSelectedEventTypes(prev =>
      prev.includes(eventType)
        ? prev.filter(t => t !== eventType)
        : [...prev, eventType]
    );
  }, []);

  const toggleRiskLevelFilter = useCallback((riskLevel: string) => {
    setSelectedRiskLevels(prev =>
      prev.includes(riskLevel)
        ? prev.filter(r => r !== riskLevel)
        : [...prev, riskLevel]
    );
  }, []);

  const copyToClipboard = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  }, []);

  const exportAsJSON = useCallback(() => {
    const dataToExport = searchTerm || selectedEventTypes.length > 0 || selectedRiskLevels.length > 0 
      ? processedFilteredData : processedData;
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cybersecurity-articles-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [processedFilteredData, processedData, searchTerm, selectedEventTypes.length, selectedRiskLevels.length]);

  const exportAsCSV = useCallback(() => {
    const dataToExport = searchTerm || selectedEventTypes.length > 0 || selectedRiskLevels.length > 0 
      ? processedFilteredData : processedData;
    const headers = [
      'Title', 'Risk Score', 'Event Type', 'Attacker', 'Victim', 'Vulnerabilities', 
      'Keywords', 'Confidence', 'Date', 'URL', 'Source'
    ];
    const rows = dataToExport.map(item => [
      `"${item.articleTitle.replace(/"/g, '""')}"`,
      item.riskScore,
      item.eventType,
      `"${item.attacker}"`,
      `"${item.victim}"`,
      `"${item.vulnerabilities.join('; ')}"`,
      `"${item.keywords.join('; ')}"`,
      item.confidenceScore,
      item.articleDate || '',
      `"${item.url}"`,
      `"${item.site}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cybersecurity-articles-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [processedFilteredData, processedData, searchTerm, selectedEventTypes.length, selectedRiskLevels.length]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left hover:text-white transition-colors"
      disabled={isLoading}
    >
      <span>{children}</span>
      {sortField === field && (
        sortDirection === 'asc' ? <SortAscIcon size={14} /> : <SortDescIcon size={14} />
      )}
    </button>
  );

  if (isLoading) {
    return (
      <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-lg">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3">Processing with AI...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <BrainIcon size={24} className="mr-3" />
            AI-Processed Cybersecurity Intelligence
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {processedFilteredData.length} of {processedData.length} cybersecurity articles
            {(searchTerm || selectedEventTypes.length > 0 || selectedRiskLevels.length > 0) && ' (filtered)'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg flex items-center space-x-2 transition-all ${
              showFilters ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-gray-700/50 border border-white/10'
            }`}
          >
            <FilterIcon size={16} />
            <span>Filters</span>
            <ChevronDownIcon size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportAsJSON}
              className="px-3 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-green-300 flex items-center space-x-2 transition-all"
            >
              <DownloadIcon size={16} />
              <span>JSON</span>
            </button>
            <button
              onClick={exportAsCSV}
              className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 flex items-center space-x-2 transition-all"
            >
              <DownloadIcon size={16} />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-900/50 border border-white/5 rounded-xl p-4 mb-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search titles, attackers, victims, vulnerabilities..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                />
              </div>
            </div>

            {/* Items per page */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Items per page</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-gray-700/50 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Event Type filters */}
          {availableEventTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Event Types</label>
              <div className="flex flex-wrap gap-2">
                {availableEventTypes.map(eventType => (
                  <button
                    key={eventType}
                    onClick={() => toggleEventTypeFilter(eventType)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      selectedEventTypes.includes(eventType)
                        ? getEventTypeColor(eventType)
                        : 'bg-gray-700/30 text-gray-400 border-white/10 hover:bg-gray-700/50'
                    }`}
                  >
                    {eventType.replace('_', ' ')}
                    {selectedEventTypes.includes(eventType) && <CheckIcon size={12} className="ml-1 inline" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Risk Level filters */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Risk Levels</label>
            <div className="flex flex-wrap gap-2">
              {availableRiskLevels.map(riskLevel => (
                <button
                  key={riskLevel}
                  onClick={() => toggleRiskLevelFilter(riskLevel)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                    selectedRiskLevels.includes(riskLevel)
                      ? getRiskColor(riskLevel === 'Low (0-3)' ? 2 : riskLevel === 'Medium (4-6)' ? 5 : riskLevel === 'High (7-8)' ? 7 : 9)
                      : 'bg-gray-700/30 text-gray-400 border-white/10 hover:bg-gray-700/50'
                  }`}
                >
                  {riskLevel}
                  {selectedRiskLevels.includes(riskLevel) && <CheckIcon size={12} className="ml-1 inline" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Articles List */}
      <div className="space-y-4">
        {paginatedData.length === 0 ? (
          <div className="bg-gray-900/50 rounded-xl border border-white/5 px-6 py-12 text-center text-gray-400">
            {processedData.length === 0 ? 'No AI-processed articles available' : 'No articles match the current filters'}
          </div>
        ) : (
          paginatedData.map((article, index) => (
            <div key={`${article.url}-${index}`} className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 transition-all duration-300 hover:border-white/20">
              {/* Article Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs border ${getRiskColor(article.riskScore)}`}>
                      Risk: {article.riskScore}/10
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs border ${getEventTypeColor(article.eventType)}`}>
                      {article.eventType.replace('_', ' ')}
                    </span>
                    <div className="flex items-center text-xs text-gray-400">
                      <StarIcon size={12} className="mr-1" />
                      {Math.round(article.confidenceScore * 100)}% confidence
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{article.articleTitle}</h3>
                  
                  <div className="flex items-center text-sm text-gray-400 space-x-4">
                    <div className="flex items-center">
                      <CalendarIcon size={14} className="mr-1" />
                      {formatDate(article.articleDate)}
                    </div>
                    <div className="flex items-center">
                      <span className="text-blue-300">{article.site}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setExpandedArticle(expandedArticle === article.url ? null : article.url)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <EyeIcon size={16} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(article.url)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Copy URL"
                  >
                    {copiedUrl === article.url ? (
                      <CheckIcon size={16} className="text-green-400" />
                    ) : (
                      <CopyIcon size={16} className="text-gray-400" />
                    )}
                  </button>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Open Article"
                  >
                    <ExternalLinkIcon size={16} className="text-gray-400" />
                  </a>
                </div>
              </div>

              {/* Article Summary */}
              <p className="text-gray-300 mb-4 line-clamp-3">{article.articleSummary}</p>

              {/* Threat Intelligence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center text-sm font-medium text-gray-300 mb-2">
                    <UserIcon size={14} className="mr-2" />
                    Threat Actor
                  </div>
                  <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {article.attacker}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center text-sm font-medium text-gray-300 mb-2">
                    <BuildingIcon size={14} className="mr-2" />
                    Target/Victim
                  </div>
                  <div className="text-sm text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                    {article.victim}
                  </div>
                </div>
              </div>

              {/* Vulnerabilities */}
              {article.vulnerabilities.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center text-sm font-medium text-gray-300 mb-2">
                    <ShieldIcon size={14} className="mr-2" />
                    Vulnerabilities ({article.vulnerabilities.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {article.vulnerabilities.slice(0, 3).map((vuln, vulnIndex) => (
                      <span key={vulnIndex} className="px-2 py-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-lg text-xs">
                        {vuln}
                      </span>
                    ))}
                    {article.vulnerabilities.length > 3 && (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-300 border border-gray-500/30 rounded-lg text-xs">
                        +{article.vulnerabilities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {article.keywords.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center text-sm font-medium text-gray-300 mb-2">
                    <TagIcon size={14} className="mr-2" />
                    Keywords
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {article.keywords.slice(0, 5).map((keyword, keywordIndex) => (
                      <span key={keywordIndex} className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs">
                        {keyword}
                      </span>
                    ))}
                    {article.keywords.length > 5 && (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-300 border border-gray-500/30 rounded-lg text-xs">
                        +{article.keywords.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Expanded Details */}
              {expandedArticle === article.url && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-300">Keppel Risk Assessment:</span>
                      <div className="mt-1 space-y-1">
                        <div className={`flex items-center ${article.keppelVulnerable ? 'text-red-300' : 'text-green-300'}`}>
                          {article.keppelVulnerable ? '⚠️ Potentially Vulnerable' : '✅ Not Vulnerable'}
                        </div>
                        {article.targetsKeppelSectors && (
                          <div className="text-yellow-300">🎯 Targets Keppel Sectors</div>
                        )}
                        {article.isKeppelVendor && (
                          <div className="text-orange-300">🏢 Keppel Vendor Involved</div>
                        )}
                        {article.isKeppelCustomer && (
                          <div className="text-blue-300">👥 Keppel Customer Involved</div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-300">All Vulnerabilities:</span>
                      <div className="mt-1">
                        {article.vulnerabilities.length > 0 ? (
                          <ul className="space-y-1">
                            {article.vulnerabilities.map((vuln, vulnIndex) => (
                              <li key={vulnIndex} className="text-orange-300 text-xs">• {vuln}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-400 text-xs">None specified</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-300">All Keywords:</span>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {article.keywords.map((keyword, keywordIndex) => (
                        <span key={keywordIndex} className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-400">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, processedFilteredData.length)} of {processedFilteredData.length} articles
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-gray-700/50 border border-white/10 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      currentPage === page
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-gray-700/50 border border-white/10 hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              {totalPages > 5 && (
                <>
                  <span className="px-2 text-gray-400">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      currentPage === totalPages
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-gray-700/50 border border-white/10 hover:bg-gray-700'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-gray-700/50 border border-white/10 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 