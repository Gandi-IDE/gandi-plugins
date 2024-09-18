import React, { forwardRef } from "react";
import classNames from "classnames";
import Draggable from "react-draggable";
import { throttle } from "lodash-es";
import styles from "./styles.less";

export interface ExpansionRect {
  width: number;
  height: number;
  translateX: number;
  translateY: number;
}

interface ExpansionBoxProps {
  className?: string;
  zIndex?: number;
  title: string;
  id: string;
  minWidth: number;
  minHeight: number;
  borderRadius: number;
  children: React.ReactNode;
  containerInfo: ExpansionRect;
  /**
   * Whether the container should stay on top when active.
   */
  stayOnTop?: boolean;
  onClose?: () => void;
  onClickContainer?: (e: React.MouseEvent) => void;
  canResize?: boolean;
  onSizeChange?: (rect: ExpansionRect) => void;
}

interface ExpansionBoxRef {
  container: HTMLDivElement;
}

const MIN_VIEWER_SIZE = 100;

const verifyTranslate = (translate: { x: number; y: number }) => {
  const newTranslate = { ...translate };
  const clientHeight = window.innerHeight || document.documentElement.clientHeight;
  const clientWidth = window.innerWidth || document.documentElement.clientWidth;

  if (clientWidth < MIN_VIEWER_SIZE + translate.x) {
    newTranslate.x = Math.max(clientWidth - MIN_VIEWER_SIZE, 0);
  }
  if (clientHeight < MIN_VIEWER_SIZE + translate.y) {
    newTranslate.y = Math.max(clientHeight - MIN_VIEWER_SIZE, 0);
  }
  return newTranslate;
};

const ExpansionBox = forwardRef<ExpansionBoxRef, ExpansionBoxProps>((props, ref) => {
  const {
    className,
    zIndex,
    title,
    minWidth,
    minHeight,
    id,
    borderRadius,
    containerInfo,
    stayOnTop,
    onClose,
    onSizeChange,
    onClickContainer,
    canResize,
    children,
  } = props;
  const [position, setPosition] = React.useState({
    x: Math.max(containerInfo.translateX, 0),
    y: Math.max(containerInfo.translateY, 0),
  });
  const container = React.useRef<HTMLDivElement>(null);
  const resizable = React.useRef(false);
  const [resize, setResize] = React.useState(false);
  const direction = React.useRef("");
  const containerNodeInfo = React.useRef(containerInfo);
  const client = React.useRef({ x: 0, y: 0 });
  const bounds = React.useRef({ top: 60, left: 72 });

  const handleBringToFront = React.useCallback(() => {
    const minIndex = typeof zIndex === "undefined" ? 101 : zIndex;
    const nodes = document.getElementsByClassName(styles.container);
    [...nodes]
      .map((node: HTMLElement) => ({
        index: window.getComputedStyle(node)["z-index"],
        node,
      }))
      .sort((a, b) => a.index - b.index)
      .forEach((item, index) => {
        if (item.node === container.current) {
          item.node.style["z-index"] = nodes.length + minIndex;
        } else {
          item.node.style["z-index"] = index + 101;
        }
      });
  }, [zIndex]);

  const handleClickContainer = React.useCallback((e: React.MouseEvent) => {
    onClickContainer?.(e);
    if (stayOnTop) {
      handleBringToFront();
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent, dire: string) => {
    // 防止触发拖拽事件
    e.stopPropagation();
    direction.current = dire;
    resizable.current = true && canResize;
    client.current.x = e.clientX;
    client.current.y = e.clientY;
    container.current.style.cursor = `${dire}-resize`;
    // 防止在 resize 的过程中选中弹窗内的文本
    container.current.style.userSelect = "none";
  };

  const handleDragStop = React.useCallback(
    (_: unknown, data: { x: number; y: number }) => {
      const verifiedData = verifyTranslate(data);
      setPosition({
        x: verifiedData.x,
        y: verifiedData.y,
      });
      containerNodeInfo.current.translateX = verifiedData.x;
      containerNodeInfo.current.translateY = verifiedData.y;
      onSizeChange({ ...containerNodeInfo.current });
    },
    [onSizeChange],
  );

  React.useImperativeHandle(ref, () => ({
    container: container.current,
  }));

  React.useEffect(() => {
    // 防止调整Box大小的过程中，出现光标位置与mousedown时的位置不一致，导致click事件处理异常
    let shouldStopNextClickEventPropagate = false;
    const handleClick = (e: MouseEvent) => {
      if (shouldStopNextClickEventPropagate) {
        shouldStopNextClickEventPropagate = false;
        e.stopPropagation();
      }
    };
    const handlerMouseMove = (e: MouseEvent) => {
      const wrapper = container.current;
      const dire = direction.current;
      const { x, y } = client.current;

      if (resizable.current) {
        setResize(true);
        shouldStopNextClickEventPropagate = true;
        // 鼠标按下的位置在右边，修改宽度
        if (dire.indexOf("e") !== -1) {
          const width = Math.max(minWidth, wrapper.offsetWidth + (e.clientX - x));
          wrapper.style.width = `${width}px`;
          client.current.x = e.clientX;
          containerNodeInfo.current.width = width;
        }
        // 鼠标按下的位置在上部，修改高度
        if (dire.indexOf("n") !== -1) {
          const distance = y - e.clientY;
          const currentHeight = wrapper.offsetHeight;
          const height = Math.max(minHeight, currentHeight + distance);
          if (height >= minHeight && height !== currentHeight) {
            setPosition((pre) => {
              const newY = pre.y - distance;
              containerNodeInfo.current.translateY = newY;
              return { ...pre, y: newY };
            });
          }
          wrapper.style.height = `${height}px`;
          client.current.y = e.clientY;
          containerNodeInfo.current.height = height;
        }

        // 鼠标按下的位置在底部，修改高度
        if (dire.indexOf("s") !== -1) {
          const height = Math.max(minHeight, wrapper.offsetHeight + (e.clientY - y));
          wrapper.style.height = `${height}px`;
          client.current.y = e.clientY;
          containerNodeInfo.current.height = height;
        }

        // 鼠标按下的位置在左边，修改宽度
        if (dire.indexOf("w") !== -1) {
          const distance = x - e.clientX;
          const currentWidth = wrapper.offsetWidth;
          const width = Math.max(minWidth, currentWidth + distance);
          if (width >= minWidth && width !== currentWidth) {
            setPosition((pre) => {
              const newX = pre.x - distance;
              containerNodeInfo.current.translateX = newX;
              return { ...pre, x: newX };
            });
            wrapper.style.width = `${width}px`;
            client.current.x = e.clientX;
            containerNodeInfo.current.width = width;
          }
        }
        onSizeChange({ ...containerNodeInfo.current });
      }
    };
    const handleMouseUp = () => {
      setResize(false);
      resizable.current = false;
      container.current.style.cursor = "";
      container.current.style.userSelect = "";
    };

    window.addEventListener("mousemove", handlerMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("mousemove", handlerMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.addEventListener("click", handleClick);
    };
  }, [minHeight, minWidth, onSizeChange]);

  React.useEffect(() => {
    const handleResize = throttle(() => {
      const { translateX: x, translateY: y } = containerNodeInfo.current;
      handleDragStop(null, { x, y });
    }, 1000);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleDragStop]);

  React.useEffect(() => {
    container.current.style.setProperty("--anchor-point-size", `${borderRadius}px`);
  }, [borderRadius]);

  return (
    <Draggable position={position} bounds={bounds.current} onStop={handleDragStop} handle={"." + id}>
      <div
        className={classNames(styles.container, className)}
        ref={container}
        style={{
          zIndex,
          width: typeof containerInfo.width === "number" ? `${containerInfo.width}px` : "",
          height: typeof containerInfo.height === "number" ? `${containerInfo.height}px` : "",
        }}
        onClick={handleClickContainer}
      >
        <div className={classNames(styles.containerHeader, id)}>
          {onClose && (
            <span className={styles.closeButton} onClick={onClose} onTouchStart={onClose}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6.82843 1.05597L1.17157 6.71282M1.17157 1.05597L6.82843 6.71282"
                  stroke="var(--theme-color-g500)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
          <h3 className={styles.title}>{title}</h3>
        </div>
        {children}
        {resize && <div className={styles.containers}></div>}
        {canResize && (
          <>
            <div className={classNames(styles.anchor, styles.top)} onMouseDown={(e) => handleMouseDown(e, "n")} />
            <div className={classNames(styles.anchor, styles.right)} onMouseDown={(e) => handleMouseDown(e, "e")} />
            <div className={classNames(styles.anchor, styles.bottom)} onMouseDown={(e) => handleMouseDown(e, "s")} />
            <div className={classNames(styles.anchor, styles.left)} onMouseDown={(e) => handleMouseDown(e, "w")} />
            <div className={classNames(styles.anchor, styles.topLeft)} onMouseDown={(e) => handleMouseDown(e, "nw")} />
            <div className={classNames(styles.anchor, styles.topRight)} onMouseDown={(e) => handleMouseDown(e, "ne")} />

            <div
              className={classNames(styles.anchor, styles.bottomRight)}
              onMouseDown={(e) => handleMouseDown(e, "se")}
            />
            <div
              className={classNames(styles.anchor, styles.bottomLeft)}
              onMouseDown={(e) => handleMouseDown(e, "sw")}
            />
          </>
        )}
      </div>
    </Draggable>
  );
});

ExpansionBox.defaultProps = {
  minWidth: 0,
  minHeight: 0,
  borderRadius: 4,
  canResize: true,
  onSizeChange: () => {
    /** noop */
  },
};

export default ExpansionBox;
