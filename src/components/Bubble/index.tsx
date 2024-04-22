import * as React from "react";
import * as ReactDOM from "react-dom";
import classNames from "classnames";
import styles from "./styles.less";

interface PopperProps {
  className?: string;
  left: number;
  top: number;
  text: string;
  visible: boolean;
}

interface BubbleProps {
  className?: string;
  title: string;
  children: React.ReactElement;
}

const Popper: React.FC<PopperProps> = ({ className, visible, left, top, text = "" }) => {
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

  return visible
    ? ReactDOM.createPortal(
        <div
          className={classNames(styles.tip, className)}
          ref={containerRef}
          style={{
            left: left + horizontalOffset,
            top,
            maxWidth: text.length > 300 ? "80vw" : "190px",
            display: visible ? "" : "none",
          }}
        >
          <span>{text}</span>
          <span
            style={{
              left: `calc(50% - ${horizontalOffset}px)`,
            }}
            className={styles.triangle}
          />
        </div>,
        document.body,
      )
    : null;
};

const Bubble: React.FC<BubbleProps> = (props) => {
  const { title = "", children } = props;
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
      {React.cloneElement(children, {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      })}
      <Popper visible={tipVisible} text={title} left={position.current.x} top={position.current.y} />
    </React.Fragment>
  );
};

const areEqual = (prevProps: BubbleProps, nextProps: BubbleProps) =>
  prevProps.className === nextProps.className && prevProps.title === nextProps.title;

export default React.memo(Bubble, areEqual);
