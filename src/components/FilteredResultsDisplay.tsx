import React, { useState, useMemo, useCallback } from 'react';
import {
  SearchIcon,
  FilterIcon,
  ExternalLinkIcon,
  DownloadIcon,
  CopyIcon,
  SortAscIcon,
  SortDescIcon,
  LinkIcon,
  CalendarIcon,
  GlobeIcon,
  ChevronDownIcon,
  CheckIcon,
  XIcon
} from 'lucide-react';
import { FilteredContentItem } from '../types/crawling';

interface FilteredResultsDisplayProps {
  filteredData: FilteredContentItem[];
  isLoading?: boolean;
  onExport?: (data: FilteredContentItem[]) => void;
}

type SortField = 'title' | 'url' | 'crawledDate' | 'contentLength' | 'type';
type SortDirection = 'asc' | 'desc';

export const FilteredResultsDisplay: React.FC<FilteredResultsDisplayProps> = ({
  filteredData,
  isLoading = false,
  onExport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('crawledDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Get unique types from data
  const availableTypes = useMemo(() => {
    const types = [...new Set(filteredData.map(item => item.type))];
    return types.sort();
  }, [filteredData]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = filteredData;

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(search) ||
        item.url.toLowerCase().includes(search) ||
        item.content.toLowerCase().includes(search)
      );
    }

    // Apply type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(item => selectedTypes.includes(item.type));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (sortField) {
        case 'title':
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
          break;
        case 'url':
          valueA = a.url.toLowerCase();
          valueB = b.url.toLowerCase();
          break;
        case 'crawledDate':
          valueA = new Date(a.crawledDate);
          valueB = new Date(b.crawledDate);
          break;
        case 'contentLength':
          valueA = a.contentLength;
          valueB = b.contentLength;
          break;
        case 'type':
          valueA = a.type;
          valueB = b.type;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [filteredData, searchTerm, selectedTypes, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = processedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  const toggleTypeFilter = useCallback((type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
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

  const exportData = useCallback(() => {
    const dataToExport = searchTerm || selectedTypes.length > 0 ? processedData : filteredData;
    onExport?.(dataToExport);
  }, [processedData, filteredData, searchTerm, selectedTypes.length, onExport]);

  const exportAsJSON = useCallback(() => {
    const dataToExport = searchTerm || selectedTypes.length > 0 ? processedData : filteredData;
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `filtered-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [processedData, filteredData, searchTerm, selectedTypes.length]);

  const exportAsCSV = useCallback(() => {
    const dataToExport = searchTerm || selectedTypes.length > 0 ? processedData : filteredData;
    const headers = ['Title', 'URL', 'Type', 'Content Length', 'Crawled Date', 'Source'];
    const rows = dataToExport.map(item => [
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.url}"`,
      item.type,
      item.contentLength,
      item.crawledDate,
      `"${item.sourcePage}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `filtered-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [processedData, filteredData, searchTerm, selectedTypes.length]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'article':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'link':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'headline':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'clickable':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
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
          <span className="ml-3">Loading filtered results...</span>
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
            <LinkIcon size={24} className="mr-3" />
            Filtered URLs & Content
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {processedData.length} of {filteredData.length} items
            {(searchTerm || selectedTypes.length > 0) && ' (filtered)'}
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
                  placeholder="Search titles, URLs, or content..."
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

          {/* Type filters */}
          {availableTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Content Types</label>
              <div className="flex flex-wrap gap-2">
                {availableTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      selectedTypes.includes(type)
                        ? getTypeColor(type)
                        : 'bg-gray-700/30 text-gray-400 border-white/10 hover:bg-gray-700/50'
                    }`}
                  >
                    {type}
                    {selectedTypes.includes(type) && <CheckIcon size={12} className="ml-1 inline" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Table */}
      <div className="bg-gray-900/50 rounded-xl border border-white/5 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-800/50 px-6 py-3 border-b border-white/5">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-300">
            <div className="col-span-4">
              <SortButton field="title">Title</SortButton>
            </div>
            <div className="col-span-3">
              <SortButton field="url">URL</SortButton>
            </div>
            <div className="col-span-1">
              <SortButton field="type">Type</SortButton>
            </div>
            <div className="col-span-1">
              <SortButton field="contentLength">Length</SortButton>
            </div>
            <div className="col-span-2">
              <SortButton field="crawledDate">Crawled</SortButton>
            </div>
            <div className="col-span-1 text-center">Actions</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-white/5">
          {paginatedData.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              {filteredData.length === 0 ? 'No filtered results available' : 'No items match the current filters'}
            </div>
          ) : (
            paginatedData.map((item, index) => (
              <div key={`${item.url}-${index}`} className="px-6 py-4 hover:bg-gray-800/30 transition-colors">
                <div className="grid grid-cols-12 gap-4 items-start">
                  {/* Title */}
                  <div className="col-span-4">
                    <div className="font-medium text-white line-clamp-2">{item.title}</div>
                    {item.description && (
                      <div className="text-xs text-gray-400 mt-1 line-clamp-1">{item.description}</div>
                    )}
                  </div>

                  {/* URL */}
                  <div className="col-span-3">
                    <div className="text-sm text-blue-300 truncate font-mono">{item.url}</div>
                    <div className="text-xs text-gray-500 truncate mt-1">
                      Source: {new URL(item.sourcePage).hostname}
                    </div>
                  </div>

                  {/* Type */}
                  <div className="col-span-1">
                    <span className={`px-2 py-1 rounded-full text-xs border ${getTypeColor(item.type)}`}>
                      {item.type}
                    </span>
                  </div>

                  {/* Content Length */}
                  <div className="col-span-1">
                    <div className="text-sm">{item.contentLength.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">chars</div>
                  </div>

                  {/* Crawled Date */}
                  <div className="col-span-2">
                    <div className="text-sm">{formatDate(item.crawledDate)}</div>
                    <div className="text-xs text-gray-400 flex items-center">
                      <CalendarIcon size={12} className="mr-1" />
                      Page {item.pageNumber}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-center space-x-1">
                    <button
                      onClick={() => copyToClipboard(item.url)}
                      className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Copy URL"
                    >
                      {copiedUrl === item.url ? (
                        <CheckIcon size={16} className="text-green-400" />
                      ) : (
                        <CopyIcon size={16} className="text-gray-400" />
                      )}
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Open URL"
                    >
                      <ExternalLinkIcon size={16} className="text-gray-400" />
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-400">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, processedData.length)} of {processedData.length} results
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