import React, { CSSProperties, forwardRef, ReactElement } from 'react';
import { VariableSizeList as List, ListChildComponentProps } from 'react-window';

export interface VirtualListProps<T> {
  items: T[];
  height: number | string;
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number, style: CSSProperties) => ReactElement;
  className?: string;
  overscanCount?: number;
  onScroll?: (scrollTop: number) => void;
  width?: string | number;
}

// Generic VirtualList component
export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
  overscanCount = 3,
  onScroll,
  width = '100%'
}: VirtualListProps<T>) {
  // Calculate actual height
  const listHeight = typeof height === 'string' 
    ? height 
    : height || window.innerHeight - 200; // Default with some padding

  // Row renderer wrapper
  const Row = ({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    return renderItem(item, index, style);
  };

  // Get item size
  const getItemSize = typeof itemHeight === 'function' 
    ? itemHeight 
    : () => itemHeight;

  return (
    <List
      className={`virtual-list ${className}`}
      height={listHeight as number}
      itemCount={items.length}
      itemSize={getItemSize}
      width={width}
      overscanCount={overscanCount}
      style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
      onScroll={({ scrollOffset }) => {
        if (onScroll) {
          onScroll(scrollOffset);
        }
      }}
    >
      {Row}
    </List>
  );
}

// Fixed size list for better performance when all items have same height
export interface FixedVirtualListProps<T> {
  items: T[];
  height: number | string;
  itemHeight: number;
  renderItem: (item: T, index: number, style: CSSProperties) => ReactElement;
  className?: string;
  overscanCount?: number;
}

export function FixedVirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
  overscanCount = 3
}: FixedVirtualListProps<T>) {
  return (
    <VirtualList
      items={items}
      height={height}
      itemHeight={itemHeight}
      renderItem={renderItem}
      className={className}
      overscanCount={overscanCount}
    />
  );
}

// AutoSizer wrapper for responsive virtual lists
interface AutoSizedVirtualListProps<T> extends Omit<VirtualListProps<T>, 'height' | 'width'> {
  minHeight?: number;
}

export const AutoSizedVirtualList = forwardRef<any, AutoSizedVirtualListProps<any>>(
  function AutoSizedVirtualList<T>({ 
    minHeight = 400,
    ...props 
  }: AutoSizedVirtualListProps<T>, ref) {
    const [dimensions, setDimensions] = React.useState({ 
      height: minHeight, 
      width: window.innerWidth 
    });

    React.useEffect(() => {
      const handleResize = () => {
        // Calculate available height
        const headerHeight = 64; // App header
        const tabBarHeight = 64; // Bottom tab bar
        const safeAreaBottom = parseInt(
          getComputedStyle(document.documentElement)
            .getPropertyValue('--safe-area-inset-bottom') || '0'
        );
        
        const availableHeight = window.innerHeight - headerHeight - tabBarHeight - safeAreaBottom - 40;
        
        setDimensions({
          height: Math.max(availableHeight, minHeight),
          width: window.innerWidth
        });
      };

      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [minHeight]);

    return (
      <VirtualList
        {...props}
        height={dimensions.height}
        width={dimensions.width}
      />
    );
  }
);