import * as React from "react";
import * as ReactDOM from "react-dom";
import classNames from "classnames";
import styles from "./styles.less";

interface TipProps {
  left: number;
  top: number;
  tipText: string;
  visible: boolean;
  shortcutKey?: string[];
}

interface TooltipProps {
  className?: string;
  icon?: React.ReactNode;
  tipText: string;
  shortcutKey?: string[];
  onClick?: (e: React.MouseEvent) => void;
}

const Tip: React.FC<TipProps> = ({ visible, left, top, tipText, shortcutKey = [] }) => {
  const [horizontalOffset, setHorizontalOffset] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>();

  React.useEffect(() => {
    if (visible) {
      let offset = 0;
      const bodyWidth = document.body.offsetWidth;
      const width = containerRef.current.offsetWidth / 2;
      if (left < width) {
        offset = width - left;
      } else if (left + width > bodyWidth) {
        offset = bodyWidth - (left + width);
      }
      setHorizontalOffset(offset);
    }
  }, [left, visible]);

  return ReactDOM.createPortal(
    <div
      className={styles.tip}
      ref={containerRef}
      style={{
        left: left + horizontalOffset - 1,
        top,
        display: visible ? "" : "none",
      }}
    >
      <span className={styles.text}>{tipText}</span>
      {shortcutKey.map((key, idx) => (
        <React.Fragment key={key}>
          <span className={styles.code}>{key}</span>
          {idx === shortcutKey.length - 1 ? "" : "+"}
        </React.Fragment>
      ))}
      <span
        style={{
          left: `calc(50% - ${horizontalOffset}px)`,
        }}
        className={styles.triangle}
      />
    </div>,
    document.body,
  );
};

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>((props, ref) => {
  const { className, icon, tipText, shortcutKey, onClick } = props;
  const [tipVisible, setTipVisible] = React.useState(false);
  const position = React.useRef({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    position.current.x = rect.x + rect.width / 2;
    position.current.y = rect.y + rect.height + 9;
    setTipVisible(true);
  };

  const handleMouseLeave = () => {
    setTipVisible(false);
  };

  return (
    <React.Fragment>
      <div
        ref={ref}
        className={classNames(styles.tipIcon, className)}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {icon}
      </div>
      <Tip
        visible={tipVisible}
        left={position.current.x}
        top={position.current.y}
        tipText={tipText}
        shortcutKey={shortcutKey}
      />
    </React.Fragment>
  );
});

const areEqual = (prevProps: TooltipProps, nextProps: TooltipProps) =>
  prevProps.className === nextProps.className &&
  prevProps.tipText === nextProps.tipText &&
  prevProps.shortcutKey === nextProps.shortcutKey;

export default React.memo(Tooltip, areEqual);
