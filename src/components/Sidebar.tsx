import React from 'react';
import { HomeIcon, SearchIcon, BarChartIcon, SettingsIcon, Wifi, WifiOff, MessageCircleIcon } from 'lucide-react';

interface SidebarProps {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError?: string;
  currentView?: 'dashboard' | 'crawler' | 'study' | 'chat';
  onViewChange?: (view: 'dashboard' | 'crawler' | 'study' | 'chat') => void;
}

export const Sidebar = ({ 
  isConnected, 
  isConnecting, 
  connectionError, 
  currentView = 'dashboard', 
  onViewChange
}: SidebarProps) => {
  const menuItems = [{
    icon: <HomeIcon size={20} />,
    label: 'Dashboard',
    active: currentView === 'dashboard',
    onClick: () => onViewChange?.('dashboard')
  }, {
    icon: <SearchIcon size={20} />,
    label: 'Crawler',
    active: currentView === 'crawler',
    onClick: () => onViewChange?.('crawler')
  }, {
    icon: <BarChartIcon size={20} />,
    label: 'Study',
    active: currentView === 'study',
    onClick: () => onViewChange?.('study')
  }, {
    icon: <MessageCircleIcon size={20} />,
    label: 'Chat',
    active: currentView === 'chat',
    onClick: () => onViewChange?.('chat')
  }, {
    icon: <SettingsIcon size={20} />,
    label: 'Settings',
    active: false,
    onClick: () => {}
  }];
  
  return (
    <aside className="w-20 lg:w-64 h-screen sticky top-0 bg-black border-r border-white/30">
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-4 flex items-center justify-center">
          <img 
            src="/mis.png" 
            alt="MiS Logo" 
            className="h-24 w-full max-w-[200px] lg:max-w-full object-contain"
          />
        </div>

        {/* Navigation */}
        <nav className="mt-1 flex-1">
          <ul className="space-y-2 px-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <button 
                  onClick={item.onClick}
                  className={`w-full flex items-center p-3 lg:px-4 rounded-xl transition-all duration-200 ${
                    item.active 
                      ? 'bg-white/10 text-white shadow-lg' 
                      : 'text-gray-400 hover:bg-white/10 hover:text-white hover:shadow-lg hover:scale-[1.04] hover:translate-x-1 transition-all duration-200'                  }`}
                >
                  <span className="flex items-center justify-center">
                    {item.icon}
                  </span>
                  <span className="ml-3 hidden lg:block">{item.label}</span>
                  {item.active && <span className="ml-auto h-2 w-2 rounded-full bg-blue-500 hidden lg:block"></span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};