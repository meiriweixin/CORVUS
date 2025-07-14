import React from 'react';
import { Sidebar } from './Sidebar';

interface NavItem {
  id: string;
  icon: React.ReactElement;
  label: string;
  onClick: () => void;
}

interface LayoutProps {
  children: React.ReactNode;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError?: string;
  navItems?: NavItem[];
  activeTabIndex?: number;
  onTabChange?: (index: number) => void;
  currentView?: 'dashboard' | 'crawler' | 'study' | 'chat' | 'scheduler';
  onViewChange?: (view: 'dashboard' | 'crawler' | 'study' | 'chat' | 'scheduler') => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  isConnected,
  isConnecting,
  connectionError,
  navItems,
  activeTabIndex = 0,
  onTabChange,
  currentView = 'dashboard',
  onViewChange
}) => {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar 
        isConnected={isConnected}
        isConnecting={isConnecting}
        connectionError={connectionError}
        currentView={currentView}
        onViewChange={onViewChange}
      />
      
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};