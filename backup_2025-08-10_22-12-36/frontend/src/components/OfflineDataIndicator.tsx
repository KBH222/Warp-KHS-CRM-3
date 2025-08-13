import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineDataIndicatorProps {
  isUnsynced?: boolean;
  lastModified?: Date;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const OfflineDataIndicator: React.FC<OfflineDataIndicatorProps> = ({
  isUnsynced = false,
  lastModified,
  className = '',
  size = 'sm',
  showText = false,
}) => {
  const isOnline = useOnlineStatus();

  if (!isUnsynced && isOnline) {
    return null; // Don't show indicator for synced data when online
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-2 h-2';
      case 'md': return 'w-3 h-3';
      case 'lg': return 'w-4 h-4';
      default: return 'w-2 h-2';
    }
  };

  const getIndicatorColor = () => {
    if (!isOnline) return 'bg-gray-400'; // Offline mode
    if (isUnsynced) return 'bg-yellow-400'; // Has unsynced changes
    return 'bg-green-400'; // Synced
  };

  const getIndicatorText = () => {
    if (!isOnline) return 'Offline';
    if (isUnsynced) return 'Unsynced';
    return 'Synced';
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Status Dot */}
      <div 
        className={`${getSizeClasses()} rounded-full ${getIndicatorColor()} flex-shrink-0`}
        title={`${getIndicatorText()}${lastModified ? ` • Modified ${formatTime(lastModified)}` : ''}`}
      >
        {/* Pulse animation for unsynced items */}
        {isUnsynced && (
          <div className={`${getSizeClasses()} rounded-full bg-yellow-400 animate-ping absolute`}></div>
        )}
      </div>

      {/* Text Indicator */}
      {showText && (
        <span className="text-xs text-gray-500">
          {getIndicatorText()}
          {lastModified && (
            <span className="ml-1">
              • {formatTime(lastModified)}
            </span>
          )}
        </span>
      )}
    </div>
  );
};

export default OfflineDataIndicator;