import React, { useState } from 'react';
import { SearchIcon, ArrowRightIcon, GlobeIcon, ShieldIcon, DatabaseIcon } from 'lucide-react';
interface URLInputProps {
  onStartCrawl: (url: string) => void;
}
export const URLInput: React.FC<URLInputProps> = ({
  onStartCrawl
}) => {
  const [url, setUrl] = useState('');
  const [selectedSites, setSelectedSites] = useState<string[]>(['hackernews', 'threatpost']);
  const predefinedSites = [{
    id: 'hackernews',
    name: 'Hacker News',
    icon: <GlobeIcon size={16} />
  }, {
    id: 'threatpost',
    name: 'ThreatPost',
    icon: <ShieldIcon size={16} />
  }, {
    id: 'krebs',
    name: 'Krebs on Security',
    icon: <DatabaseIcon size={16} />
  }, {
    id: 'darkreading',
    name: 'Dark Reading',
    icon: <ShieldIcon size={16} />
  }];
  const toggleSite = (siteId: string) => {
    if (selectedSites.includes(siteId)) {
      setSelectedSites(selectedSites.filter(id => id !== siteId));
    } else {
      setSelectedSites([...selectedSites, siteId]);
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() || selectedSites.length > 0) {
      onStartCrawl(url || selectedSites.join(','));
    }
  };
  return <div className="flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-3xl">
        <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Cyber Intelligence Crawler
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <SearchIcon size={20} className="text-gray-400" />
              </div>
              <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="Enter website URL to crawl for cybersecurity news..." className="w-full pl-12 pr-4 py-4 bg-gray-700/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                Or select from popular cybersecurity sources:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {predefinedSites.map(site => <button key={site.id} type="button" onClick={() => toggleSite(site.id)} className={`flex items-center justify-center p-3 rounded-lg border transition-all duration-200 ${selectedSites.includes(site.id) ? 'border-blue-500 bg-blue-500/20 text-blue-300' : 'border-white/10 bg-gray-700/30 text-gray-300 hover:bg-gray-700/50'}`}>
                    <span className="mr-2">{site.icon}</span>
                    <span>{site.name}</span>
                  </button>)}
              </div>
            </div>
            <div className="flex justify-center">
              <button type="submit" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-medium flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-blue-500/20">
                <span>Start Crawling</span>
                <ArrowRightIcon size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>;
};