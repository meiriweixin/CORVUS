import React from 'react';
import { Sidebar } from './Sidebar';
interface LayoutProps {
  children: React.ReactNode;
}
export const Layout: React.FC<LayoutProps> = ({
  children
}) => {
  return <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                MiS Cyber Intelligence
              </h1>
              <p className="text-gray-400 mt-1">
                Cybersecurity News Crawler & Analysis
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="font-medium">JS</span>
                </div>
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-gray-900"></div>
              </div>
            </div>
          </div>
        </header>
        <div className="relative z-10">{children}</div>
      </main>
    </div>;
};