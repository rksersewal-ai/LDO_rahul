"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { type ReactNode, useRef } from "react";

export interface VirtualDocumentListProps {
  /** Array of items to render */
  items: unknown[];
  /** Render function for each row */
  renderRow: (item: unknown, index: number) => ReactNode;
  /** Estimated height of each row in pixels */
  rowHeight?: number;
  /** Height of the scrollable container in pixels */
  containerHeight?: number;
}

/**
 * Virtualized list component for large document sets.
 * Only renders visible rows plus an overscan buffer, improving performance
 * when rendering hundreds or thousands of items.
 */
export function VirtualDocumentList({
  items,
  renderRow,
  rowHeight = 48,
  containerHeight = 600,
}: VirtualDocumentListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="overflow-auto rounded-md border"
      style={{ height: `${containerHeight}px` }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderRow(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
