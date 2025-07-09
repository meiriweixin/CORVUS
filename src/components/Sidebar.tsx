import React from 'react';
import { HomeIcon, SearchIcon, BarChartIcon, AlertCircleIcon, SettingsIcon, DatabaseIcon, ShieldIcon } from 'lucide-react';
export const Sidebar = () => {
  const menuItems = [{
    icon: <HomeIcon size={20} />,
    label: 'Dashboard',
    active: true
  }, {
    icon: <SearchIcon size={20} />,
    label: 'Crawler',
    active: false
  }, {
    icon: <BarChartIcon size={20} />,
    label: 'Analytics',
    active: false
  }, {
    icon: <AlertCircleIcon size={20} />,
    label: 'Threats',
    active: false
  }, {
    icon: <DatabaseIcon size={20} />,
    label: 'Data',
    active: false
  }, {
    icon: <ShieldIcon size={20} />,
    label: 'Security',
    active: false
  }, {
    icon: <SettingsIcon size={20} />,
    label: 'Settings',
    active: false
  }];
  return <aside className="w-20 lg:w-64 h-screen sticky top-0 bg-gray-900 bg-opacity-50 backdrop-blur-lg border-r border-white/5">
      <div className="flex flex-col h-full">
        <div className="p-4 flex items-center justify-center lg:justify-start">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-xl font-bold">M</span>
          </div>
          <span className="ml-3 text-xl font-bold hidden lg:block">MiS</span>
        </div>
        <nav className="mt-8 flex-1">
          <ul className="space-y-2 px-2">
            {menuItems.map((item, index) => <li key={index}>
                <a href="#" className={`flex items-center p-3 lg:px-4 rounded-xl transition-all duration-200 ${item.active ? 'bg-gray-800/50 text-white border border-white/10 shadow-lg' : 'text-gray-400 hover:bg-gray-800/30 hover:text-white'}`}>
                  <span className="flex items-center justify-center">
                    {item.icon}
                  </span>
                  <span className="ml-3 hidden lg:block">{item.label}</span>
                  {item.active && <span className="ml-auto h-2 w-2 rounded-full bg-blue-500 hidden lg:block"></span>}
                </a>
              </li>)}
          </ul>
        </nav>
        <div className="p-4 mt-auto">
          <div className="hidden lg:block px-4 py-2 text-xs text-gray-400">
            <div>MiS Cyber Intelligence</div>
            <div>v1.2.4</div>
          </div>
        </div>
      </div>
    </aside>;
};