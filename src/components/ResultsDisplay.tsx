import React, { useState } from 'react';
import { SearchIcon, FilterIcon, ArrowDownIcon, ExternalLinkIcon, BookmarkIcon, AlertTriangleIcon } from 'lucide-react';
export const ResultsDisplay = () => {
  const [filter, setFilter] = useState('all');
  const articles = [{
    title: 'Critical Vulnerability in Log4j Library Affects Millions of Applications',
    source: 'ThreatPost',
    date: '2 hours ago',
    summary: 'A new zero-day vulnerability in the widely used Log4j library has been discovered, potentially affecting millions of Java applications worldwide.',
    risk: 'critical',
    cve: 'CVE-2023-4567',
    tags: ['java', 'zero-day', 'rce']
  }, {
    title: 'New Ransomware Group Targeting Healthcare Organizations',
    source: 'KrebsOnSecurity',
    date: '5 hours ago',
    summary: 'A newly identified ransomware group is specifically targeting healthcare organizations with sophisticated phishing campaigns.',
    risk: 'high',
    tags: ['ransomware', 'healthcare', 'phishing']
  }, {
    title: 'Microsoft Releases Emergency Patch for Windows Server',
    source: 'Hacker News',
    date: '1 day ago',
    summary: 'Microsoft has released an out-of-band security update to address a critical vulnerability in Windows Server that could allow remote code execution.',
    risk: 'high',
    cve: 'CVE-2023-3389',
    tags: ['windows', 'patch', 'microsoft']
  }, {
    title: 'Supply Chain Attack Compromises Popular npm Package',
    source: 'Dark Reading',
    date: '2 days ago',
    summary: 'A widely used npm package was compromised in a supply chain attack, potentially affecting thousands of downstream projects.',
    risk: 'medium',
    tags: ['supply-chain', 'npm', 'javascript']
  }];
  const filteredArticles = filter === 'all' ? articles : articles.filter(article => article.risk === filter);
  return <div className="mt-8">
      <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
          <h2 className="text-xl font-bold">Crawling Results</h2>
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={16} className="text-gray-400" />
              </div>
              <input type="text" placeholder="Search articles..." className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" />
            </div>
            <div className="flex space-x-3">
              <div className="relative">
                <button className="flex items-center space-x-2 px-4 py-2 bg-gray-700/50 border border-white/10 rounded-lg text-sm">
                  <FilterIcon size={16} />
                  <span>Filter</span>
                  <ArrowDownIcon size={14} />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-white/10 rounded-xl shadow-xl z-20 hidden">
                  <div className="py-2">
                    <a href="#" className="block px-4 py-2 text-sm hover:bg-gray-700">
                      All Threats
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm hover:bg-gray-700">
                      Critical
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm hover:bg-gray-700">
                      High
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm hover:bg-gray-700">
                      Medium
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm hover:bg-gray-700">
                      Low
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex space-x-1">
                <button onClick={() => setFilter('all')} className={`px-3 py-2 rounded-lg text-sm ${filter === 'all' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' : 'bg-gray-700/50 border border-white/10'}`}>
                  All
                </button>
                <button onClick={() => setFilter('critical')} className={`px-3 py-2 rounded-lg text-sm ${filter === 'critical' ? 'bg-red-500/30 text-red-300 border border-red-500/50' : 'bg-gray-700/50 border border-white/10'}`}>
                  Critical
                </button>
                <button onClick={() => setFilter('high')} className={`px-3 py-2 rounded-lg text-sm ${filter === 'high' ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' : 'bg-gray-700/50 border border-white/10'}`}>
                  High
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {filteredArticles.map((article, index) => <div key={index} className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-5 transition-all duration-300 hover:border-white/20">
              <div className="flex justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`mt-1 flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${article.risk === 'critical' ? 'bg-red-500/20 text-red-500' : article.risk === 'high' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
                    <AlertTriangleIcon size={14} />
                  </div>
                  <div>
                    <h3 className="font-medium">{article.title}</h3>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <span>{article.source}</span>
                      <span className="mx-2">•</span>
                      <span>{article.date}</span>
                      {article.cve && <>
                          <span className="mx-2">•</span>
                          <span className="font-mono">{article.cve}</span>
                        </>}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-1.5 rounded-lg hover:bg-gray-800 transition">
                    <BookmarkIcon size={16} className="text-gray-400" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-gray-800 transition">
                    <ExternalLinkIcon size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-300 mt-3">{article.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {article.tags.map((tag, tagIndex) => <span key={tagIndex} className="px-2.5 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">
                    {tag}
                  </span>)}
                <span className={`px-2.5 py-1 text-xs rounded-full ml-auto ${article.risk === 'critical' ? 'bg-red-500/20 text-red-300' : article.risk === 'high' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'}`}>
                  {article.risk.charAt(0).toUpperCase() + article.risk.slice(1)}{' '}
                  Risk
                </span>
              </div>
            </div>)}
        </div>
      </div>
    </div>;
};