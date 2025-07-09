import React, { useEffect, useState } from 'react';
import { Loader2Icon, CheckIcon, XIcon, AlertTriangleIcon } from 'lucide-react';
interface CrawlingAnimationProps {
  progress: number;
}
export const CrawlingAnimation: React.FC<CrawlingAnimationProps> = ({
  progress
}) => {
  const [crawledSites, setCrawledSites] = useState<{
    site: string;
    status: 'pending' | 'success' | 'error' | 'warning';
  }[]>([{
    site: 'hackernews.ycombinator.com',
    status: 'pending'
  }, {
    site: 'threatpost.com',
    status: 'pending'
  }, {
    site: 'krebsonsecurity.com',
    status: 'pending'
  }, {
    site: 'darkreading.com',
    status: 'pending'
  }, {
    site: 'thehackernews.com',
    status: 'pending'
  }]);
  const [articles, setArticles] = useState<number>(0);
  const [threats, setThreats] = useState<number>(0);
  useEffect(() => {
    // Update site statuses based on progress
    if (progress > 20 && crawledSites[0].status === 'pending') {
      updateSiteStatus(0, 'success');
      setArticles(12);
    }
    if (progress > 40 && crawledSites[1].status === 'pending') {
      updateSiteStatus(1, 'success');
      setArticles(prev => prev + 8);
      setThreats(3);
    }
    if (progress > 60 && crawledSites[2].status === 'pending') {
      updateSiteStatus(2, 'warning');
      setArticles(prev => prev + 4);
      setThreats(prev => prev + 2);
    }
    if (progress > 80 && crawledSites[3].status === 'pending') {
      updateSiteStatus(3, 'success');
      setArticles(prev => prev + 9);
      setThreats(prev => prev + 4);
    }
    if (progress > 90 && crawledSites[4].status === 'pending') {
      updateSiteStatus(4, 'error');
    }
  }, [progress, crawledSites]);
  const updateSiteStatus = (index: number, status: 'pending' | 'success' | 'error' | 'warning') => {
    setCrawledSites(prev => prev.map((site, i) => i === index ? {
      ...site,
      status
    } : site));
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckIcon size={16} className="text-green-500" />;
      case 'error':
        return <XIcon size={16} className="text-red-500" />;
      case 'warning':
        return <AlertTriangleIcon size={16} className="text-yellow-500" />;
      default:
        return <Loader2Icon size={16} className="text-blue-500 animate-spin" />;
    }
  };
  return <div className="flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-3xl">
        <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Crawling in Progress
          </h2>
          <div className="mb-8">
            <div className="flex justify-between mb-2 text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2.5">
              <div className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out" style={{
              width: `${progress}%`
            }}></div>
            </div>
          </div>
          <div className="space-y-4 mb-8">
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Crawling Sites:
            </h3>
            <div className="bg-gray-900/50 rounded-xl border border-white/5 divide-y divide-white/5">
              {crawledSites.map((site, index) => <div key={index} className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    <div className="mr-3">{getStatusIcon(site.status)}</div>
                    <span className="text-sm">{site.site}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${site.status === 'success' ? 'bg-green-500/20 text-green-300' : site.status === 'error' ? 'bg-red-500/20 text-red-300' : site.status === 'warning' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'}`}>
                    {site.status === 'success' ? 'Completed' : site.status === 'error' ? 'Failed' : site.status === 'warning' ? 'Partial' : 'Pending'}
                  </span>
                </div>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4">
              <div className="text-sm text-gray-400">Articles Found</div>
              <div className="text-2xl font-bold mt-1">{articles}</div>
            </div>
            <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4">
              <div className="text-sm text-gray-400">Threats Identified</div>
              <div className="text-2xl font-bold mt-1 text-yellow-500">
                {threats}
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-gray-400 animate-pulse">
            Analyzing content and extracting threat intelligence...
          </div>
        </div>
      </div>
      <div className="mt-12 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl opacity-30"></div>
        <div className="relative z-10">
          <div className="w-32 h-32 rounded-full border-t-4 border-l-4 border-r-4 border-blue-500 animate-spin"></div>
          <div className="w-24 h-24 rounded-full border-t-4 border-l-4 border-purple-500 animate-spin absolute top-4 left-4" style={{
          animationDirection: 'reverse',
          animationDuration: '1.5s'
        }}></div>
          <div className="w-16 h-16 rounded-full border-t-4 border-r-4 border-cyan-500 animate-spin absolute top-8 left-8" style={{
          animationDuration: '1s'
        }}></div>
        </div>
      </div>
    </div>;
};