import React from 'react';
export const ThreatMap = () => {
  return <div className="relative h-80">
      {/* World map background - simplified representation */}
      <div className="absolute inset-0 opacity-20 bg-white mask-image-world-map"></div>
      {/* Threat hotspots */}
      <div className="absolute h-4 w-4 bg-red-500 rounded-full top-1/4 left-1/4 animate-pulse shadow-lg shadow-red-500/50">
        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
      </div>
      <div className="absolute h-3 w-3 bg-yellow-500 rounded-full top-1/3 left-1/2 animate-pulse shadow-lg shadow-yellow-500/50">
        <div className="absolute inset-0 bg-yellow-500 rounded-full animate-ping opacity-75"></div>
      </div>
      <div className="absolute h-5 w-5 bg-red-500 rounded-full top-1/2 left-3/4 animate-pulse shadow-lg shadow-red-500/50">
        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
      </div>
      <div className="absolute h-3 w-3 bg-yellow-500 rounded-full bottom-1/3 right-1/4 animate-pulse shadow-lg shadow-yellow-500/50">
        <div className="absolute inset-0 bg-yellow-500 rounded-full animate-ping opacity-75"></div>
      </div>
      <div className="absolute h-4 w-4 bg-red-500 rounded-full bottom-1/4 right-1/3 animate-pulse shadow-lg shadow-red-500/50">
        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
      </div>
      {/* Legend */}
      <div className="absolute bottom-0 right-0 bg-gray-900/70 backdrop-blur-sm p-3 rounded-lg border border-white/10">
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center">
            <div className="h-3 w-3 bg-red-500 rounded-full mr-2"></div>
            <span>Critical</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>High</span>
          </div>
        </div>
      </div>
      {/* Stylized overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent pointer-events-none"></div>
      {/* Placeholder text since we don't have a real map implementation */}
      <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
        Interactive threat map visualization (placeholder)
      </div>
    </div>;
};