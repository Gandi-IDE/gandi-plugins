import styles from "../styles.less";
import React, { useRef } from "react";
import { Spinner } from "@gandi-ide/gandi-ui";
import classNames from "classnames";

interface BluePrintProps {
  content: {
    url: string;
    block: string;
    detail?: { creationRelease: { coverGifLink: number; coverLink: number }; description: string; type: Array<string> };
  };
  msg: (key: string) => string;
}

const BluePrint: React.FC<BluePrintProps> = ({ content, msg }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loading, setLoading] = React.useState(true);

  const dragstart = () => {
    if (content.detail && content.detail.type) {
      window.postMessage(["startDrop", content.detail], "*");
    } else {
      window.postMessage(["startDrop", String(content.url)], "*");
    }
  };

  const dragend = (e: React.DragEvent<HTMLImageElement>) => {
    window.postMessage(["cancelDrop", [e.clientX, e.clientY]], "*");
  };

  const load = () => {
    setLoading(false);
  };

  return (
    <div className={styles.imgCard}>
      {loading && (
        <div className={styles.imgCardLoad}>
          <Spinner id={"block-sharing-loading"} className={styles.loading} />
        </div>
      )}
      <img
        className={classNames(styles.inner, styles.block)}
        ref={imgRef}
        src={content.url}
        alt={msg("plugins.blockSharing.bluePrint")}
        width="100%"
        height="500px"
        onLoad={load}
        onDragStart={dragstart}
        onDragEnd={dragend}
      />
    </div>
  );
};

export default BluePrint;
