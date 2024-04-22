import * as React from "react";
import classNames from "classnames";
import styles from "./styles.less";

interface TabProps {
  className?: string;
  items: Array<string>;
  activeIndex?: number;
  onChange?: (activeKey: number) => void;
}

const Tab = React.forwardRef<HTMLDivElement, TabProps>((props, ref) => {
  const { className, items, activeIndex, onChange } = props;
  const [index, setIndex] = React.useState(activeIndex);

  React.useEffect(() => {
    if (typeof activeIndex !== undefined && index !== activeIndex) {
      setIndex(index);
    }
  }, [index, activeIndex]);

  return (
    <div className={classNames(styles.tab, className)} ref={ref}>
      {items.map((label, idx) => (
        <button
          key={label}
          className={index === idx ? styles.active : null}
          onClick={() => {
            onChange?.(idx);
            setIndex(idx);
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
});

const areEqual = (prevProps: TabProps, nextProps: TabProps) =>
  prevProps.className === nextProps.className &&
  prevProps.items === nextProps.items &&
  prevProps.onChange === nextProps.onChange;

export default React.memo(Tab, areEqual);
