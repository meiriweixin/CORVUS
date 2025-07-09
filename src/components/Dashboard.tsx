import React from 'react';
import { BarChartIcon, TrendingUpIcon, AlertTriangleIcon, ShieldIcon, ClockIcon, GlobeIcon, ServerIcon, CodeIcon } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { ThreatMap } from './ThreatMap';
import { ThreatTimeline } from './ThreatTimeline';
export const Dashboard = () => {
  const stats = [{
    title: 'Total Articles',
    value: '33',
    icon: <BarChartIcon size={18} />,
    color: 'blue'
  }, {
    title: 'Threats Detected',
    value: '9',
    icon: <AlertTriangleIcon size={18} />,
    color: 'yellow'
  }, {
    title: 'Critical Vulnerabilities',
    value: '3',
    icon: <ShieldIcon size={18} />,
    color: 'red'
  }, {
    title: 'Average Risk Score',
    value: '6.8',
    icon: <TrendingUpIcon size={18} />,
    color: 'purple'
  }];
  return <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => <DashboardCard key={index} title={stat.title} value={stat.value} icon={stat.icon} color={stat.color} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-full shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Threat Distribution Map</h3>
              <div className="flex space-x-2">
                <button className="p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700/80 transition">
                  <GlobeIcon size={16} />
                </button>
                <button className="p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700/80 transition">
                  <ServerIcon size={16} />
                </button>
              </div>
            </div>
            <ThreatMap />
          </div>
        </div>
        <div>
          <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-full shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Recent Threats</h3>
              <button className="p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700/80 transition">
                <ClockIcon size={16} />
              </button>
            </div>
            <ThreatTimeline />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Top Vulnerabilities</h3>
            <button className="p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700/80 transition">
              <CodeIcon size={16} />
            </button>
          </div>
          <div className="space-y-4">
            {[{
            cve: 'CVE-2023-4567',
            severity: 'Critical',
            score: 9.8,
            affected: 'Windows Server 2022'
          }, {
            cve: 'CVE-2023-3389',
            severity: 'High',
            score: 8.5,
            affected: 'Apache Log4j'
          }, {
            cve: 'CVE-2023-2290',
            severity: 'Critical',
            score: 9.2,
            affected: 'Cisco IOS XE'
          }, {
            cve: 'CVE-2023-1678',
            severity: 'High',
            score: 7.8,
            affected: 'OpenSSL'
          }].map((vuln, index) => <div key={index} className="flex items-center justify-between bg-gray-900/50 rounded-xl p-4 border border-white/5">
                <div>
                  <div className="font-medium">{vuln.cve}</div>
                  <div className="text-sm text-gray-400">{vuln.affected}</div>
                </div>
                <div className="flex items-center">
                  <div className={`text-sm px-2 py-1 rounded-lg mr-3 ${vuln.severity === 'Critical' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                    {vuln.severity}
                  </div>
                  <div className="font-bold text-lg">{vuln.score}</div>
                </div>
              </div>)}
          </div>
        </div>
        <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Threat Actors</h3>
            <button className="p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700/80 transition">
              <AlertTriangleIcon size={16} />
            </button>
          </div>
          <div className="space-y-4">
            {[{
            name: 'Lazarus Group',
            origin: 'North Korea',
            target: 'Financial Institutions',
            activity: 'High'
          }, {
            name: 'APT29',
            origin: 'Russia',
            target: 'Government',
            activity: 'Medium'
          }, {
            name: 'BlackCat',
            origin: 'Unknown',
            target: 'Healthcare',
            activity: 'High'
          }, {
            name: 'Lapsus$',
            origin: 'Brazil',
            target: 'Tech Companies',
            activity: 'Medium'
          }].map((actor, index) => <div key={index} className="flex items-center justify-between bg-gray-900/50 rounded-xl p-4 border border-white/5">
                <div>
                  <div className="font-medium">{actor.name}</div>
                  <div className="text-sm text-gray-400">
                    Target: {actor.target}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-sm text-gray-400 mr-3">
                    {actor.origin}
                  </div>
                  <div className={`text-sm px-2 py-1 rounded-lg ${actor.activity === 'High' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                    {actor.activity}
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </div>
    </div>;
};