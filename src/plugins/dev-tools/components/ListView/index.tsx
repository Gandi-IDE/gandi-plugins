import * as React from "react";
import Bubble from "components/Bubble";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { ListVariable } from "../../lib/dev-tools-observer";
import styles from "./styles.less";

export interface ListViewProps {
  value: ListVariable;
}

const ListView: React.FC<ListViewProps> = ({ value }) => {
  const parentRef = React.useRef();

  // The virtualizer
  const rowVirtualizer = useVirtualizer({
    count: (value || []).length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
  });

  return (
    <div ref={parentRef} className={styles.virtualListContainer}>
      {/* The large inner element to hold all of the items */}
      <div
        className={styles.virtualListContainerInner}
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {/* Only the visible items in the virtualizer, manually positioned to be in view */}
        {rowVirtualizer.getVirtualItems().map((virtualItem) => (
          <div
            className={styles.virtualListItem}
            key={virtualItem.key}
            style={{
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <span className={styles.index}>{virtualItem.index + 1}</span>
            <Bubble title={String(value[virtualItem.index] || "")}>
              <span className={styles.text}>{value[virtualItem.index]}</span>
            </Bubble>
          </div>
        ))}
      </div>
    </div>
  );
};

ListView.displayName = "ListView";

export default ListView;
