import React, { useEffect } from 'react';
import { XIcon, DownloadIcon, ZoomInIcon, ZoomOutIcon } from 'lucide-react';
import { Screenshot } from '../types/crawling';

interface ScreenshotModalProps {
  screenshot: Screenshot | null;
  screenshotId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (id: string, screenshot: Screenshot) => void;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  screenshot,
  screenshotId,
  isOpen,
  onClose,
  onDownload
}) => {
  const [zoomLevel, setZoomLevel] = React.useState(100);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset zoom when opening new screenshot
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(100);
    }
  }, [isOpen, screenshotId]);

  if (!isOpen || !screenshot || !screenshotId) {
    return null;
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(300, prev + 25));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(25, prev - 25));
  };

  const handleDownload = () => {
    if (onDownload && screenshotId && screenshot) {
      onDownload(screenshotId, screenshot);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s ago`;
    }
    return `${seconds}s ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full h-full max-w-7xl max-h-[95vh] bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-bold text-white">Screenshot: {screenshotId}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Size: {formatFileSize(screenshot.size)}</span>
              <span>Taken: {formatTimeAgo(screenshot.timestamp)}</span>
              <span>Zoom: {zoomLevel}%</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOutIcon size={18} className="text-gray-300" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomInIcon size={18} className="text-gray-300" />
            </button>
            
            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Download Screenshot"
            >
              <DownloadIcon size={18} className="text-gray-300" />
            </button>
            
            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Close (ESC)"
            >
              <XIcon size={18} className="text-gray-300" />
            </button>
          </div>
        </div>
        
        {/* Image Container */}
        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-center">
            <img
              src={`data:image/png;base64,${screenshot.data}`}
              alt={`Screenshot ${screenshotId}`}
              style={{ 
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease-in-out'
              }}
              className="max-w-none border border-white/10 rounded-lg shadow-lg"
              draggable={false}
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div>Use mouse wheel or zoom buttons to adjust size</div>
            <div>Press ESC to close</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 