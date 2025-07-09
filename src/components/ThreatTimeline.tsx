import React from 'react';
import { AlertTriangleIcon, GlobeIcon, ShieldIcon } from 'lucide-react';
export const ThreatTimeline = () => {
  const threats = [{
    time: '2 hours ago',
    title: 'Critical RCE Vulnerability',
    source: 'CVE-2023-4567',
    severity: 'critical',
    icon: <AlertTriangleIcon size={14} />
  }, {
    time: '5 hours ago',
    title: 'New Ransomware Campaign',
    source: 'ThreatPost',
    severity: 'high',
    icon: <GlobeIcon size={14} />
  }, {
    time: '1 day ago',
    title: 'Patch Available for Windows',
    source: 'Microsoft',
    severity: 'medium',
    icon: <ShieldIcon size={14} />
  }, {
    time: '2 days ago',
    title: 'DDoS Attack on Financial Sector',
    source: 'KrebsOnSecurity',
    severity: 'high',
    icon: <GlobeIcon size={14} />
  }];
  return <div className="space-y-4">
      {threats.map((threat, index) => <div key={index} className="relative">
          {index !== threats.length - 1 && <div className="absolute top-6 bottom-0 left-2.5 w-0.5 bg-gray-700/50"></div>}
          <div className="flex items-start">
            <div className={`mt-1 flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${threat.severity === 'critical' ? 'bg-red-500/20 text-red-500' : threat.severity === 'high' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
              {threat.icon}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium">{threat.title}</div>
              <div className="flex items-center text-xs text-gray-400 mt-0.5">
                <span>{threat.source}</span>
                <span className="mx-2">•</span>
                <span>{threat.time}</span>
              </div>
            </div>
          </div>
        </div>)}
      <button className="w-full mt-4 py-2 bg-gray-700/50 rounded-lg text-sm text-gray-300 hover:bg-gray-700/80 transition">
        View All Threats
      </button>
    </div>;
};