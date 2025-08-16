import React, { ReactNode } from 'react';

interface ScrollablePageContainerProps {
  children: ReactNode;
  className?: string;
  hasHorizontalScroll?: boolean;
  customPaddingBottom?: number;
  showScrollIndicator?: boolean;
}

export const ScrollablePageContainer: React.FC<ScrollablePageContainerProps> = ({
  children,
  className = '',
  hasHorizontalScroll = false,
  customPaddingBottom,
  showScrollIndicator = false
}) => {
  // Calculate bottom padding: tab bar (64px) + safe area + extra padding
  const bottomPadding = customPaddingBottom 
    ? `${customPaddingBottom}px` 
    : 'calc(80px + env(safe-area-inset-bottom, 0px))';

  return (
    <div 
      className={`scrollable-page-container ${className}`}
      style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: hasHorizontalScroll ? 'auto' : 'hidden',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        paddingBottom: bottomPadding,
        position: 'relative'
      }}
    >
      {showScrollIndicator && hasHorizontalScroll && (
        <div className="horizontal-scroll-indicator">
          <span>← Scroll horizontally →</span>
        </div>
      )}
      {children}
    </div>
  );
};

// Horizontal scroll wrapper for tables
interface HorizontalScrollWrapperProps {
  children: ReactNode;
  className?: string;
  minWidth?: string;
}

export const HorizontalScrollWrapper: React.FC<HorizontalScrollWrapperProps> = ({
  children,
  className = '',
  minWidth = '600px'
}) => {
  return (
    <div 
      className={`horizontal-scroll-wrapper ${className}`}
      style={{
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        marginLeft: '-1rem',
        marginRight: '-1rem',
        paddingLeft: '1rem',
        paddingRight: '1rem'
      }}
    >
      <div style={{ minWidth }}>
        {children}
      </div>
    </div>
  );
};